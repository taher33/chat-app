module.exports = (socket, io, client) => {
  function privateMessage(payload) {
    const { email, message } = payload;
    client.lrange("users", 0, -1, (err, usersString) => {
      const users = usersString.map((user) => JSON.parse(user));
      // todo : find the user that the message is sent to
      //todo: if u dont find here look into mongoDB
      //todo: send the message
    });
  }

  socket.on("private message", privateMessage);
};
