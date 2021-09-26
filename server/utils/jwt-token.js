const jwt = require("jsonwebtoken");
const { handleError } = require("./errors");
exports.handleToken = async (socket) => {
  const token = socket.handshake.auth.token;

  try {
    if (!token || token === "abcd")
      return socket.emit("connection_error", "not authorized");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
  } catch (err) {
    let error = handleError(err);
    socket.emit("connection_error", error);
  }
};
