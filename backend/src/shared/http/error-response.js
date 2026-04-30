function sendError(reply, statusCode, code, message) {
  reply.code(statusCode).send({
    code,
    message
  });
}

module.exports = {
  sendError
};
