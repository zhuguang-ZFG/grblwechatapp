const crypto = require("crypto");

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = {
  createToken
};
