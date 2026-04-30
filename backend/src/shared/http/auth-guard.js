const { sendError } = require("./error-response");

function registerAuthGuard(app) {
  app.decorate("authenticate", async function authenticate(request, reply) {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return sendError(reply, 401, "auth_required", "Missing bearer token");
    }

    const session = app.db
      .prepare("SELECT token, user_id FROM sessions WHERE token = ?")
      .get(token);

    if (!session) {
      return sendError(reply, 401, "invalid_session", "Session is invalid or expired");
    }

    const user = app.db
      .prepare("SELECT id, nickname, avatar_url, mobile, profile_status FROM users WHERE id = ?")
      .get(session.user_id);

    request.currentUser = {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      mobile: user.mobile,
      profileStatus: user.profile_status
    };
  });
}

module.exports = {
  registerAuthGuard
};
