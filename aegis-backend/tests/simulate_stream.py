# simulate_stream.py
import asyncio
import websockets
import json
import sys

async def run_live_simulation(session_id: str):
    uri = f"ws://127.0.0.1:8004/ws/audio/{session_id}"
    print(f"[*] Probing backend port 8004 and initiating socket handshake...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("[+] Connection established successfully. Starting ambient stream...\n")
            
            # Phase 1: Normal Dialogue Stream (Verifying Ingestion & Throttling)
            dialogue = [
                {"speaker": "Doctor", "text": "Good afternoon, John. What brings you into the clinic today?"},
                {"speaker": "Patient", "text": "Hey doc, I've been dealing with a massive sinus headache and thick green drainage for over a week now."},
                {"speaker": "Doctor", "text": "Alright, let me take a look. Any fevers, chills, or facial tenderness when you lean forward?"},
                {"speaker": "Patient", "text": "Yes, absolutely. My upper teeth are actually throbbing, and I had a low-grade fever last night."},
            ]
            
            for turn in dialogue:
                # Simulate realistic streaming cadence by breaking turns into words
                words = turn["text"].split()
                print(f"Streaming as {turn['speaker']}...")
                for i in range(0, len(words), 2):
                    chunk = " ".join(words[i:i+2]) + " "
                    payload = {
                        "speaker": turn["speaker"],
                        "text": chunk,
                        "type": "TRANSCRIPT_CHUNK"
                    }
                    await websocket.send(json.dumps(payload))
                    await asyncio.sleep(0.15) # High-speed token delivery
                await asyncio.sleep(0.8) # Natural pause between conversational turns
                
            print("\n[+] Normal clinical ingestion complete. Pausing before adversarial injection...")
            await asyncio.sleep(3)

            # Phase 2: The Adversarial Strike (Triggering the Failsafe Lockout)
            print("[!] Injecting high-risk medication proposal into the graph...")
            adversarial_payload = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "stage_clinical_order",
                    "arguments": {
                        "status": "draft",
                        "intent": "proposal",
                        "medicationCodeableConcept": {
                            "coding": [{"system": "RxNorm", "code": "308182", "display": "Amoxicillin-Clavulanate 875-125mg PO BID"}],
                            "text": "Staged via automated triage suite."
                        },
                        "subject": {"reference": "Patient/PID-9923"},
                        "dosageInstruction": [{"text": "Take once daily for 7 days"}]
                    }
                },
                "id": 8812,
                "auth_token": "aegis_secure_node_alpha_2026"
            }
            
            # Send the raw transaction frame directly through the communication channel
            await websocket.send(json.dumps({
                "type": "EHR_TRANSACTION_PROPOSAL",
                "payload": adversarial_payload
            }))
            print("[+] Adversarial payload sent. Check the Deliberation HUD for the Reactor SCRAM.")
            
    except Exception as e:
        print(f"[-] Test execution failed: {str(e)}")
        print("[-] Ensure your FastAPI server is actively running on port 8000 and CORS/WebSocket routes are bound.")

if __name__ == "__main__":
    session = sys.argv[1] if len(sys.argv) > 1 else "demo_session_2026"
    asyncio.run(run_live_simulation(session))
