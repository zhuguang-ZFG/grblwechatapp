function createDevicesService(app) {
  const db = app.db;

  function listDevices() {
    const items = db.prepare(`
      SELECT id, name, model, bind_status, online_status, last_seen_at
      FROM devices
      ORDER BY id ASC
    `).all();

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

    db.prepare(`
      UPDATE devices
      SET owner_user_id = ?, bind_status = 'bound', online_status = 'online'
      WHERE id = ?
    `).run(userId, device.id);

    return {
      deviceId: device.id,
      bindStatus: "bound"
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
