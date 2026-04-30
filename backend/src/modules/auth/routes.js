const { sendError } = require("../../shared/http/error-response");

function registerAuthRoutes(app) {
  const auth = app.authService;

  app.post("/api/v1/auth/wechat-login", async (request) => {
    return auth.wechatLogin(request.body);
  });

  app.post("/api/v1/auth/register", async (request, reply) => {
    if (!request.body.agreeTerms) {
      return sendError(reply, 400, "terms_required", "Terms agreement is required");
    }
    return auth.register(request.body);
  });

  app.post("/api/v1/auth/complete-profile", { preHandler: [app.authenticate] }, async (request) => ({
    user: auth.completeProfile(request.currentUser.id, request.body)
  }));

  app.get("/api/v1/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    return auth.getMe(request.currentUser.id);
  });
}

module.exports = {
  registerAuthRoutes
};
