import os
from pathlib import Path
from datetime import datetime

# =========================================================
# AEGIS TRIAGE OS — ULTRA WORKSPACE SOURCE DIGEST ENGINE
# =========================================================

OUTPUT_FILE = "aegis_complete_source_digest.md"   # ← moved before EXCLUDE_FILES

# High-noise / heavy dependency exclusion matrix
EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    "venv",
    "env",
    ".venv",
    "__pycache__",
    ".git",
    "dist",
    "build",
    ".vercel",
    ".turbo",
    "out",
    "coverage",
    ".pytest_cache",
    ".mypy_cache",
    ".idea",
    ".vscode",
    ".cache",
    "target",
    "bin",
    "obj",
}

# Explicit file exclusions (now includes OUTPUT_FILE)
EXCLUDE_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".DS_Store",
    OUTPUT_FILE,   # correct exclusion
}

# Production-grade source coverage
VALID_EXTENSIONS = {
    # Python
    ".py",

    # JavaScript / TypeScript
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",

    # Web
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".less",

    # Config / Infra
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".env",

    # Backend / Systems
    ".java",
    ".kt",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".cs",

    # C / C++
    ".c",
    ".cpp",
    ".h",
    ".hpp",

    # DevOps / Shell
    ".sh",
    ".bash",
    ".zsh",
    ".tf",

    # Database
    ".sql",

    # Docs
    ".md",
    ".txt",
    ".rst",

    # XML / Misc
    ".xml",
    ".svg",
    ".graphql",
    ".gql",
}

# Files without normal extensions
SPECIAL_FILES = {
    "dockerfile",
    ".env",
    ".gitignore",
    ".gitattributes",
    ".prettierrc",
    ".eslintrc",
    ".babelrc",
    "requirements.txt",
    "pyproject.toml",
    "docker-compose.yml",
    "docker-compose.yaml",
    "makefile",
}

# Binary extensions blocked explicitly
BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".mp4",
    ".mp3",
    ".wav",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
    ".rar",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".pdf",
}

# Max readable file size (5 MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


def safe_read_file(file_path):
    """
    Safely read file contents with robust encoding fallback.
    """
    encodings = ["utf-8", "utf-16", "latin-1"]

    for encoding in encodings:
        try:
            with open(file_path, "r", encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
        except Exception as e:
            return f"// FILE ACCESS ERROR: {str(e)}"

    return "// FAILED TO DECODE FILE CONTENT"


def is_valid_source_file(file_name):
    """
    Determines whether file should be included.
    """
    file_lower = file_name.lower()

    if file_lower in EXCLUDE_FILES:
        return False

    ext = os.path.splitext(file_lower)[1]

    if ext in BINARY_EXTENSIONS:
        return False

    if file_lower in SPECIAL_FILES:
        return True

    return ext in VALID_EXTENSIONS


def detect_language(file_name):
    """
    Markdown code block language inference.
    """
    ext = os.path.splitext(file_name)[1].lower()

    mapping = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "jsx",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".json": "json",
        ".css": "css",
        ".scss": "scss",
        ".html": "html",
        ".md": "markdown",
        ".sh": "bash",
        ".sql": "sql",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".xml": "xml",
        ".cpp": "cpp",
        ".c": "c",
        ".java": "java",
        ".go": "go",
        ".rs": "rust",
        ".php": "php",
    }

    return mapping.get(ext, "")


def compile_entire_workspace():
    """
    Deep recursive workspace source compiler.
    """
    print("[*] Initializing AEGIS deep workspace synthesis engine...")

    start_time = datetime.now()

    file_count = 0
    skipped_count = 0
    total_size = 0

    workspace_root = Path(".").resolve()
    output_path = Path(OUTPUT_FILE).resolve()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:

        out.write("# AEGIS TRIAGE OS COMPLETE SOURCE DIGEST\n\n")
        out.write(f"Generated: {datetime.now()}\n\n")
        out.write(f"Workspace Root: `{workspace_root}`\n\n")
        out.write("---\n\n")

        for root, dirs, files in os.walk(workspace_root, followlinks=False):

            # Dynamic pruning of excluded directories
            dirs[:] = [
                d for d in dirs
                if d not in EXCLUDE_DIRS and not d.startswith(".")
            ]

            # Deterministic ordering
            dirs.sort()
            files.sort()

            for file in files:

                if not is_valid_source_file(file):
                    skipped_count += 1
                    continue

                file_path = Path(root) / file

                # Skip the output file itself (defensive double check)
                if file_path.resolve() == output_path:
                    continue

                try:
                    file_size = file_path.stat().st_size
                except Exception:
                    skipped_count += 1
                    continue

                if file_size > MAX_FILE_SIZE:
                    print(f"[!] Skipping oversized file: {file_path}")
                    skipped_count += 1
                    continue

                relative_path = file_path.relative_to(workspace_root)

                print(f"[+] Extracting: {relative_path}")

                total_size += file_size
                file_count += 1

                language = detect_language(file)

                out.write(f"## FILE: {relative_path}\n\n")
                out.write(f"**Size:** `{file_size} bytes`\n\n")

                out.write(f"```{language}\n")

                try:
                    content = safe_read_file(file_path)
                    out.write(content)
                except Exception as e:
                    out.write(f"\n// CRITICAL EXTRACTION FAILURE: {str(e)}\n")

                out.write("\n```\n\n")
                out.write("---\n\n")

        end_time = datetime.now()
        duration = end_time - start_time

        out.write("# EXTRACTION SUMMARY\n\n")
        out.write(f"- Files Extracted: `{file_count}`\n")
        out.write(f"- Files Skipped: `{skipped_count}`\n")
        out.write(f"- Total Size: `{total_size} bytes`\n")
        out.write(f"- Duration: `{duration}`\n")

    print("\n==================================================")
    print("[+] AEGIS extraction completed successfully.")
    print(f"[+] Files extracted : {file_count}")
    print(f"[+] Files skipped   : {skipped_count}")
    print(f"[+] Total size      : {total_size} bytes")
    print(f"[+] Output artifact : {OUTPUT_FILE}")
    print("==================================================")


if __name__ == "__main__":
    compile_entire_workspace()