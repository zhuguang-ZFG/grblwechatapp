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

  return {
    writeText
  };
}

module.exports = {
  createArtifactStore
};
