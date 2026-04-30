const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/projects/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const statusFormatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");
const projectFormatterPath = path.resolve(__dirname, "../miniprogram/utils/project-formatters.js");

function loadProjectsPage({ actionTapIndex = 0, modalConfirm = true } = {}) {
  delete require.cache[pagePath];

  let pageDefinition = null;
  const calls = {
    duplicateProject: [],
    archiveProject: [],
    restoreProject: [],
    deleteProject: [],
    navigateTo: [],
    showActionSheet: 0,
    showModal: 0,
    showToast: []
  };

  global.Page = (definition) => {
    pageDefinition = definition;
  };

  global.wx = {
    showActionSheet(options) {
      calls.showActionSheet += 1;
      options.success({ tapIndex: actionTapIndex });
    },
    showModal(options) {
      calls.showModal += 1;
      options.success({ confirm: modalConfirm });
    },
    showToast(options) {
      calls.showToast.push(options.title);
    },
    navigateTo(options) {
      calls.navigateTo.push(options.url);
    }
  };

  require.cache[apiPath] = {
    id: apiPath,
    filename: apiPath,
    loaded: true,
    exports: {
      async listProjects() {
        return [
          {
            id: "prj_1",
            name: "Project A",
            sourceType: "text",
            status: "draft",
            selectedDeviceId: "dev_123",
            latestPreviewId: "pre_1",
            latestGenerationId: "gen_1",
            updatedAt: "2026-05-01T10:00:00Z"
          },
          {
            id: "prj_2",
            name: "Archived Project",
            sourceType: "image",
            status: "archived",
            selectedDeviceId: "dev_123",
            latestPreviewId: null,
            latestGenerationId: null,
            updatedAt: "2026-05-01T09:00:00Z"
          }
        ];
      },
      async listDevices() {
        return {
          items: [
            { id: "dev_123", name: "KX Laser A1", onlineStatus: "online" }
          ]
        };
      },
      async createProject(sourceType) {
        return { id: `created_${sourceType}` };
      },
      async duplicateProject(projectId) {
        calls.duplicateProject.push(projectId);
        return { id: "prj_copy_1" };
      },
      async archiveProject(projectId) {
        calls.archiveProject.push(projectId);
        return { id: projectId, archived: true };
      },
      async restoreProject(projectId) {
        calls.restoreProject.push(projectId);
        return { id: projectId, status: "draft" };
      },
      async deleteProject(projectId) {
        calls.deleteProject.push(projectId);
        return { id: projectId, deleted: true };
      }
    }
  };

  require.cache[pageAuthPath] = {
    id: pageAuthPath,
    filename: pageAuthPath,
    loaded: true,
    exports: {
      requireAuth() {
        return true;
      }
    }
  };

  require.cache[statusFormatterPath] = {
    id: statusFormatterPath,
    filename: statusFormatterPath,
    loaded: true,
    exports: {
      formatDeviceStatus(value) {
        return value;
      }
    }
  };

  require.cache[projectFormatterPath] = {
    id: projectFormatterPath,
    filename: projectFormatterPath,
    loaded: true,
    exports: {
      formatProjectType(value) {
        return value;
      },
      formatProjectUpdatedAt(value) {
        return value;
      },
      formatArtifactState(value) {
        return value || "-";
      }
    }
  };

  require(pagePath);
  return { pageDefinition, calls };
}

function createCtx() {
  return {
    data: {
      filters: ["全部", "文字", "图片", "已归档"],
      filterValues: ["all", "text", "image", "archived"],
      filterIndex: 0,
      projects: [],
      actionLoading: false,
      actionProjectId: ""
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
}

async function run() {
  const activePage = loadProjectsPage({ actionTapIndex: 0 });
  const activeCtx = createCtx();
  Object.assign(activeCtx, activePage.pageDefinition);
  await activePage.pageDefinition.loadProjects.call(activeCtx);
  assert.deepStrictEqual(activeCtx.data.projects.map((item) => item.id), ["prj_1"]);
  activePage.pageDefinition.openProject.call(activeCtx, {
    currentTarget: { dataset: { id: "prj_1", archived: false } }
  });
  assert.deepStrictEqual(activePage.calls.navigateTo[0], "/pages/workspace/editor/index?id=prj_1");

  await activePage.pageDefinition.openProjectActions.call(activeCtx, {
    currentTarget: { dataset: { id: "prj_1", archived: false } }
  });
  assert.deepStrictEqual(activePage.calls.duplicateProject, ["prj_1"]);
  assert.strictEqual(activePage.calls.showModal, 0);
  assert.strictEqual(activePage.calls.showToast[0], "已复制项目");
  assert.deepStrictEqual(activePage.calls.navigateTo.pop(), "/pages/workspace/editor/index?id=prj_copy_1");

  const archivePage = loadProjectsPage({ actionTapIndex: 1, modalConfirm: true });
  const archiveCtx = createCtx();
  Object.assign(archiveCtx, archivePage.pageDefinition);
  await archivePage.pageDefinition.loadProjects.call(archiveCtx);
  await archivePage.pageDefinition.openProjectActions.call(archiveCtx, {
    currentTarget: { dataset: { id: "prj_1", archived: false } }
  });
  assert.deepStrictEqual(archivePage.calls.archiveProject, ["prj_1"]);
  assert.strictEqual(archivePage.calls.showModal, 1);
  assert.strictEqual(archivePage.calls.showToast[0], "项目已归档");

  const deletePage = loadProjectsPage({ actionTapIndex: 2, modalConfirm: false });
  const deleteCtx = createCtx();
  Object.assign(deleteCtx, deletePage.pageDefinition);
  await deletePage.pageDefinition.loadProjects.call(deleteCtx);
  await deletePage.pageDefinition.openProjectActions.call(deleteCtx, {
    currentTarget: { dataset: { id: "prj_1", archived: false } }
  });
  assert.deepStrictEqual(deletePage.calls.deleteProject, []);
  assert.strictEqual(deletePage.calls.showModal, 1);

  const archivedFilterPage = loadProjectsPage();
  const archivedFilterCtx = createCtx();
  Object.assign(archivedFilterCtx, archivedFilterPage.pageDefinition);
  archivedFilterCtx.data.filterIndex = 3;
  await archivedFilterPage.pageDefinition.loadProjects.call(archivedFilterCtx);
  assert.deepStrictEqual(archivedFilterCtx.data.projects.map((item) => item.id), ["prj_2"]);
  assert.strictEqual(archivedFilterCtx.data.projects[0].isArchived, true);

  archivedFilterPage.pageDefinition.openProject.call(archivedFilterCtx, {
    currentTarget: { dataset: { id: "prj_2", archived: true } }
  });
  assert.deepStrictEqual(archivedFilterPage.calls.navigateTo, []);
  assert.strictEqual(archivedFilterPage.calls.showToast[0], "已归档项目请先恢复");

  const restorePage = loadProjectsPage({ actionTapIndex: 0 });
  const restoreCtx = createCtx();
  Object.assign(restoreCtx, restorePage.pageDefinition);
  restoreCtx.data.filterIndex = 3;
  await restorePage.pageDefinition.loadProjects.call(restoreCtx);
  await restorePage.pageDefinition.openProjectActions.call(restoreCtx, {
    currentTarget: { dataset: { id: "prj_2", archived: true } }
  });
  assert.deepStrictEqual(restorePage.calls.restoreProject, ["prj_2"]);
  assert.strictEqual(restorePage.calls.showModal, 0);
  assert.strictEqual(restorePage.calls.showToast[0], "项目已恢复");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
