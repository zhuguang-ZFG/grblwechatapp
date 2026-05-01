const fs = require("fs");
const path = require("path");

function createArtifactStore(storageDir) {
  fs.mkdirSync(storageDir, { recursive: true });

  function writeText(relativePath, content) {
    const fullPath = path.join(storageDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
    return fullPath;
  }

  function writeBinary(relativePath, buffer) {
    const fullPath = path.join(storageDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return fullPath;
  }

  function resolvePath(relativePath) {
    const fullPath = path.resolve(path.join(storageDir, relativePath));
    const resolvedDir = path.resolve(storageDir);
    if (!fullPath.startsWith(resolvedDir)) {
      return null;
    }
    return fullPath;
  }

  function exists(relativePath) {
    return fs.existsSync(path.join(storageDir, relativePath));
  }

  function readBinary(relativePath) {
    const fullPath = path.join(storageDir, relativePath);
    return fs.readFileSync(fullPath);
  }

  function listDir(relativePath) {
    const fullPath = path.join(storageDir, relativePath);
    try {
      return fs.readdirSync(fullPath);
    } catch {
      return [];
    }
  }

  function remove(relativePath) {
    const fullPath = path.join(storageDir, relativePath);
    try {
      fs.unlinkSync(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  function stat(relativePath) {
    const fullPath = path.join(storageDir, relativePath);
    try {
      return fs.statSync(fullPath);
    } catch {
      return null;
    }
  }

  // Clean up old artifacts. Keep at most `keepCount` most recent files per prefix.
  // Files are sorted by mtime (newest first), the rest are deleted.
  function cleanByCount(subdir, keepCount = 10) {
    const fullDir = path.join(storageDir, subdir);
    let files;
    try {
      files = fs.readdirSync(fullDir);
    } catch {
      return 0;
    }
    const entries = files
      .map((f) => ({ name: f, fullPath: path.join(fullDir, f), mtime: fs.statSync(path.join(fullDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    let deleted = 0;
    for (let i = keepCount; i < entries.length; i++) {
      try {
        fs.unlinkSync(entries[i].fullPath);
        deleted++;
      } catch { /* skip */ }
    }
    return deleted;
  }

  return {
    writeText,
    writeBinary,
    resolvePath,
    exists,
    readBinary,
    listDir,
    remove,
    stat,
    cleanByCount
  };
}

module.exports = {
  createArtifactStore
};
