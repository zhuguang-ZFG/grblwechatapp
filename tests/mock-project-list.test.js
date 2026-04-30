const assert = require("assert");
const path = require("path");

const mockApiPath = path.resolve(__dirname, "../miniprogram/utils/mock-api.js");

delete require.cache[mockApiPath];
const mockApi = require(mockApiPath);

async function run() {
  const initialProjects = await mockApi.listProjects();
  assert.ok(Array.isArray(initialProjects), "listProjects should return an array");
  assert.ok(initialProjects.length >= 1, "mock project list should not be empty");

  const created = await mockApi.createProject("text");
  const refreshedProjects = await mockApi.listProjects();
  assert.strictEqual(refreshedProjects[0].id, created.id);
  assert.strictEqual(refreshedProjects[0].sourceType, "text");

  const duplicated = await mockApi.duplicateProject(created.id);
  const afterDuplicate = await mockApi.listProjects();
  assert.strictEqual(afterDuplicate[0].id, duplicated.id);
  assert.strictEqual(afterDuplicate[0].name.includes("Copy"), true);

  await mockApi.archiveProject(duplicated.id);
  const afterArchive = await mockApi.listProjects();
  assert.strictEqual(afterArchive.some((item) => item.id === duplicated.id), false);

  await mockApi.deleteProject(created.id);
  const afterDelete = await mockApi.listProjects();
  assert.strictEqual(afterDelete.some((item) => item.id === created.id), false);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
