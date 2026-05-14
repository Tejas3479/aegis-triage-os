# 🧠 AI, NLP & Data Privacy

## Multimodal Inference Engine
Aegis OS utilizes the **Google GenAI SDK (`gemini-2.5-pro`)** orchestrated by **LangGraph**. 
* **Why LangGraph?** Standard LLM chains are stateless. Medical triage requires a stateful, multi-turn approach where the AI remembers previous symptoms and refines its diagnosis graph.

## Ethical AI: The Presidio PII Vault
We built a "Defense-in-Depth" privacy layer.
1. **NLP Scrubbing:** `presidio-analyzer` and `presidio-anonymizer` detect and mask `PERSON` and `LOCATION` entities.
2. **Encryption:** All data at rest in the Supabase database is encrypted.

## Predictive Outbreak Clustering
Using synthetic geolocation data representing Bengaluru (generated via our `mock_datasets.py`), we use Scikit-Learn's **HDBSCAN**.
* By converting GPS coordinates to radians, we apply the **Haversine metric** to calculate true spherical distances, allowing the backend to cluster high-density respiratory or viral outbreaks autonomously.
