function formatProjectType(value) {
  if (value === "text") {
    return "文字";
  }
  if (value === "image") {
    return "图片";
  }
  return value || "-";
}

function formatProjectUpdatedAt(value) {
  if (!value) {
    return "刚刚更新";
  }
  return value.replace("T", " ").replace("Z", "");
}

function formatArtifactState(value) {
  if (!value) {
    return "未生成";
  }
  return "已生成";
}

module.exports = {
  formatProjectType,
  formatProjectUpdatedAt,
  formatArtifactState
};
