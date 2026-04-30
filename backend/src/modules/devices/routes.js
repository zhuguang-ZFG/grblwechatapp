const { sendError } = require("../../shared/http/error-response");

function registerDevicesRoutes(app) {
  app.get("/api/v1/devices", { preHandler: [app.authenticate] }, async () => {
    return app.devicesService.listDevices();
  });

  app.post("/api/v1/devices/bind", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.devicesService.bindDevice(request.currentUser.id, request.body.bindingCode);
    if (!result) {
      return sendError(reply, 404, "device_not_found", "Binding code was not found");
    }
    return result;
  });
}

module.exports = {
  registerDevicesRoutes
};
