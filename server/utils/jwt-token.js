const jwt = require("jsonwebtoken");
exports.handleToken = async (socket) => {
  const token = socket.handshake.auth.token;

  try {
    if (!token || token === "abcd")
      return socket.emit("connection_error", "not authorized");
    const decoded = jwt.verify(token, "cute cat");
    socket.user = decoded;
  } catch (err) {
    console.error(err);
    socket.emit("connection_error", "NOK");
  }
};
