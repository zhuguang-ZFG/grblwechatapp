const session = require("./utils/session");

App({
  globalData: {
    currentUser: null
  },

  onLaunch() {
    this.globalData.currentUser = session.getCurrentUser();
  }
});
