from app.core.database import db_client
from app.models.schemas import PatientProfile
from typing import Optional

class MasterPatientIndex:
    """
    Master Patient Index (MPI) Simulator.
    Resolves the active session patient ID and queries the EHR to fetch
    the baseline PatientProfile snapshot.
    """
    
    @staticmethod
    async def resolve_patient_profile(session_id: str) -> PatientProfile:
        """
        Resolves a patient profile by querying Supabase patients table linked to the session.
        Falls back to mock data if database lookup fails or fields are missing.
        """
        fallback = PatientProfile(
            age=45,
            gender="F",
            medical_history=["Hypertension", "Asthma"],
            known_allergies=["Penicillin"],
            current_meds=["Albuterol HFA", "Lisinopril 10mg"],
            latitude=13.1008,
            longitude=77.5963
        )
        
        if not db_client.client:
            return fallback
            
        try:
            # Query triage_sessions to get patient relation
            response = db_client.client.table("triage_sessions")\
                .select("latitude, longitude, patients(*)").eq("id", session_id).limit(1).execute()
                
            if response.data:
                row = response.data[0]
                patient = row.get("patients") or {}
                
                return PatientProfile(
                    age=patient.get("age") or fallback.age,
                    gender=patient.get("gender") or fallback.gender,
                    medical_history=patient.get("medical_history") or fallback.medical_history,
                    known_allergies=patient.get("known_allergies") or fallback.known_allergies,
                    current_meds=patient.get("current_meds") or fallback.current_meds,
                    latitude=row.get("latitude") or fallback.latitude,
                    longitude=row.get("longitude") or fallback.longitude
                )
        except Exception as e:
            import logging
            logging.getLogger("aegis_core").warning(f"MPI lookup failed for {session_id}: {e}")
            
        return fallback

mpi = MasterPatientIndex()
