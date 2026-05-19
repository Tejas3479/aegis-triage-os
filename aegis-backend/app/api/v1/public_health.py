import logging
import numpy as np
from fastapi import APIRouter, HTTPException
from app.core.database import db_client
from sklearn.cluster import HDBSCAN

router = APIRouter()
logger = logging.getLogger("aegis_core")

@router.get("/outbreaks")
async def detect_outbreaks():
    """
    Geospatial epidemic clustering routine using HDBSCAN.
    Clusters geolocation data from triage sessions to detect outbreaks.
    """
    import redis.asyncio as redis
    from app.core.config import settings
    import json
    
    # 0. Check Cache
    try:
        r = await redis.from_url(settings.REDIS_URL)
        cached = await r.get("outbreak_clusters")
        if cached:
            await r.close()
            logger.info("Returning cached outbreak clusters.")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Redis cache read failed: {e}")
        r = None

    if not db_client.client:
        raise HTTPException(status_code=500, detail="Database unavailable")
        
    try:
        # Fetch geolocation data from triage sessions via patients join
        response = db_client.client.table("triage_sessions").select("id, patients(geo_latitude, geo_longitude)").execute()
        data = response.data
        
        # Filter valid coordinates
        coords = []
        session_ids = []
        for row in data:
            patients = row.get("patients")
            if patients and patients.get("geo_latitude") and patients.get("geo_longitude"):
                coords.append([patients["geo_latitude"], patients["geo_longitude"]])
                session_ids.append(row["id"])
                
        if not coords:
            return {
                "status": "success",
                "cluster_count": 0,
                "clusters": [],
                "message": "No geolocation data available for clustering."
            }
            
        X = np.array(coords)
        # HDBSCAN with haversine metric expects radians
        X_radians = np.radians(X)
        
        # 1.5 km in radians (earth radius ~6371 km)
        # 1.5 / 6371 = 0.000235
        # min_cluster_size=2 to detect small outbreaks
        db = HDBSCAN(min_cluster_size=2, metric='haversine', cluster_selection_epsilon=0.000235)
        labels = db.fit_predict(X_radians)
        
        # Group by labels
        clusters = {}
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1:
                continue # Noise
                
            member_indices = np.where(labels == label)[0]
            member_ids = [session_ids[i] for i in member_indices]
            member_coords = X[member_indices]
            
            # Calculate center (mean)
            center = member_coords.mean(axis=0)
            
            clusters[str(label)] = {
                "cluster_id": int(label),
                "center": {"latitude": float(center[0]), "longitude": float(center[1])},
                "size": len(member_indices),
                "session_ids": member_ids
            }
            
        response_data = {
            "status": "success",
            "cluster_count": len(clusters),
            "clusters": list(clusters.values()),
            "message": f"Detected {len(clusters)} active clusters."
        }
        
        # Store in cache
        if r:
            try:
                await r.setex("outbreak_clusters", 300, json.dumps(response_data))
                await r.close()
                logger.info("Cached outbreak clusters for 5 minutes.")
            except Exception as e:
                logger.warning(f"Redis cache write failed: {e}")
                
        return response_data
        
    except Exception as e:
        logger.error(f"Outbreak detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Clustering failed: {str(e)}")
