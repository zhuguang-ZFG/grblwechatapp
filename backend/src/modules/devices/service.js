const crypto = require("crypto");

function createDevicesService(app) {
  const db = app.db;

  function listDevices(userId) {
    const items = db.prepare(`
      SELECT id, name, model, bind_status, online_status, last_seen_at
      FROM devices
      WHERE owner_user_id = '' OR owner_user_id = ?
      ORDER BY id ASC
    `).all(userId);

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        model: item.model,
        bindStatus: item.bind_status,
        onlineStatus: item.online_status,
        lastSeenAt: item.last_seen_at
      }))
    };
  }

  function bindDevice(userId, bindingCode) {
    const device = db.prepare("SELECT * FROM devices WHERE binding_code = ?").get(bindingCode);
    if (!device) {
      return null;
    }

    if (device.owner_user_id && device.owner_user_id !== "") {
      return { error: { code: "device_already_bound", message: "该设备已被绑定" } };
    }

    const deviceToken = `devtok_${crypto.randomBytes(12).toString("hex")}`;
    db.prepare(`
      UPDATE devices
      SET owner_user_id = ?, bind_status = 'bound', online_status = 'online', device_token = ?
      WHERE id = ?
    `).run(userId, deviceToken, device.id);

    return {
      deviceId: device.id,
      bindStatus: "bound",
      deviceToken
    };
  }

  return {
    listDevices,
    bindDevice
  };
}

module.exports = {
  createDevicesService
};
