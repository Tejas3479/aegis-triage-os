#!/usr/bin/env python3
"""Download the small English Vosk model for local STT."""
import os
import sys
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
TARGET_DIR = Path(__file__).resolve().parents[1] / "models" / "vosk-en-small"


def main() -> int:
    TARGET_DIR.parent.mkdir(parents=True, exist_ok=True)
    zip_path = TARGET_DIR.parent / "vosk-model-small-en-us-0.15.zip"

    if TARGET_DIR.exists():
        print(f"Model already present at {TARGET_DIR}")
        return 0

    print(f"Downloading {MODEL_URL} ...")
    urlretrieve(MODEL_URL, zip_path)

    print("Extracting...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(TARGET_DIR.parent)

    extracted = TARGET_DIR.parent / "vosk-model-small-en-us-0.15"
    if extracted.exists() and not TARGET_DIR.exists():
        extracted.rename(TARGET_DIR)

    zip_path.unlink(missing_ok=True)
    print(f"Vosk model ready at {TARGET_DIR}")
    print("Set VOSK_MODEL_PATH to this directory in .env")
    return 0


if __name__ == "__main__":
    sys.exit(main())
