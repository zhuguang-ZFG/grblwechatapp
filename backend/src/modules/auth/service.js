const crypto = require("crypto");
const { createToken } = require("../../shared/session/token-store");

function now() {
  return new Date().toISOString();
}

function userView(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    mobile: row.mobile,
    profileStatus: row.profile_status
  };
}

function createAuthService(app) {
  const db = app.db;

  function wechatLogin(payload) {
    const openId = `openid_${payload.code}`;
    const user = db.prepare("SELECT * FROM users WHERE wechat_open_id = ?").get(openId);

    if (!user) {
      const tempAuthToken = createToken();
      db.prepare(`
        INSERT INTO temp_auth_sessions (token, wechat_open_id, profile_json, created_at)
        VALUES (?, ?, ?, ?)
      `).run(tempAuthToken, openId, JSON.stringify(payload.profile || {}), now());

      return {
        isNewUser: true,
        tempAuthToken,
        profile: payload.profile || {},
        nextAction: "register"
      };
    }

    const token = createToken();
    db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)")
      .run(token, user.id, now());

    return {
      isNewUser: false,
      token,
      user: userView(user),
      nextAction: user.profile_status === "completed" ? "enter_app" : "complete_profile"
    };
  }

  function register(payload) {
    const id = `usr_${crypto.randomUUID().slice(0, 8)}`;
    let openId = payload.wechatOpenId;

    if (!openId && payload.tempAuthToken) {
      const tempAuth = db.prepare(`
        SELECT token, wechat_open_id FROM temp_auth_sessions WHERE token = ?
      `).get(payload.tempAuthToken);

      if (tempAuth) {
        openId = tempAuth.wechat_open_id;
      }
    }

    db.prepare(`
      INSERT INTO users (id, wechat_open_id, nickname, avatar_url, mobile, profile_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, openId, payload.nickname, payload.avatarUrl || "", payload.mobile, "completed", now());

    if (payload.tempAuthToken) {
      db.prepare("DELETE FROM temp_auth_sessions WHERE token = ?").run(payload.tempAuthToken);
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    const token = createToken();
    db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)")
      .run(token, id, now());

    return {
      token,
      user: userView(user),
      nextAction: "enter_app"
    };
  }

  function completeProfile(userId, payload) {
    db.prepare(`
      UPDATE users
      SET nickname = ?, mobile = ?, profile_status = 'completed'
      WHERE id = ?
    `).run(payload.nickname, payload.mobile, userId);

    return userView(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
  }

  function getMe(userId) {
    return userView(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
  }

  return {
    wechatLogin,
    register,
    completeProfile,
    getMe
  };
}

module.exports = {
  createAuthService
};
