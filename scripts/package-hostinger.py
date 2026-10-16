"""Build the source-only ZIP accepted by Hostinger's Node.js deploy tool."""
from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parent.parent
destination = root / "downloads" / "24CoinAtlas-node-source.zip"
destination.parent.mkdir(exist_ok=True)
files = [root / name for name in (
    "package.json", "package-lock.json", "index.html", "vite.config.js",
    "README.md", "Dockerfile", ".dockerignore", ".gitignore", ".env.example",
)]
for directory in ("src", "server", "scripts", "public", "docs", "tests"):
    files.extend(sorted((root / directory).rglob("*")))

with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in files:
        if not path.is_file():
            continue
        if path.is_symlink():
            raise RuntimeError("Refusing to archive a symbolic link")
        relative = path.relative_to(root)
        if any(part in {".env", ".data", ".git", "node_modules", "dist", "downloads", "backups", "__pycache__"} for part in relative.parts):
            raise RuntimeError("Private or generated path in deployment archive")
        info = zipfile.ZipInfo(relative.as_posix())
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, path.read_bytes())

with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert "package.json" in archive.namelist()
    assert "server/index.js" in archive.namelist()
    assert len([name for name in archive.namelist() if name.startswith("server/migrations/")]) == 6
assert destination.stat().st_size < 50 * 1024 * 1024
digest = hashlib.sha256(destination.read_bytes()).hexdigest()
destination.with_suffix(".zip.sha256").write_text(f"{digest}  {destination.name}\n")
print(f"Verified Node.js source archive: {destination.name} ({destination.stat().st_size} bytes)")
