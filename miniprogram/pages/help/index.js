const pageAuth = require("../../utils/page-auth");
const helpCenterContent = require("../../config/help-center");

Page({
  data: helpCenterContent,

  onShow() {
    pageAuth.requireAuth();
  }
});
