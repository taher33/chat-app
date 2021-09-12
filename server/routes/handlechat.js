const Messages = require("../models/messages");
const Users = require("../models/users");
const { handleError } = require("../utils/errors");
const { handleToken } = require("../utils/jwt-token");

module.exports = (io, socket, client) => {
  async function privateMessage(payload, cb) {
    handleToken(socket);
    if (!socket.user.data.id) return cb({ error: "login please" }); //! should handle the error in the client

    const { email, message } = payload;
    try {
      const usersString = await client.smembers("users");

      let recieverId;
      let msg;
      const users = usersString.map((user) => JSON.parse(user));
      const user = users.filter((user) => user.email === email);

      // TODO : check if this works down here
      if (user.length !== 0) {
        recieverId = user[0].id;
        msg = {
          reciever: recieverId,
          sender: socket.user.data.id,
          content: message,
        };

        socket.to(user[0].id).emit("private message", msg);
      } else {
        recieverId = await Users.find({ email })._id;
      }

      //todo: make the error handler for this

      if (!recieverId) return cb({ error: "user does not exist" });
      msg.reciever = recieverId;
      cb({ message: msg });
      console.log("id exists ----------------");
      // storing the message
      await Messages.create({
        sender: socket.user.data.id,
        content: message,
        reciever: recieverId,
      });
    } catch (err) {
      const error = handleError(err);
      cb({ error });
    }
  }
  const getMessages = async (payload, cb) => {
    const selectedUserID = payload.id;
    handleToken(socket);

    let prevMessages = [];
    try {
      const prevmsg1 = await Messages.find({
        sender: selectedUserID,
        reciever: socket.user.data.id,
      });
      const prevmsg2 = await Messages.find({
        sender: socket.user.data.id,
        reciever: selectedUserID,
      });
      prevMessages = [...prevmsg1, ...prevmsg2];
      prevMessages.sort((msg1, msg2) => {
        return msg1.createdAt - msg2.createdAt;
      });
      cb({ message: prevMessages });
    } catch (err) {
      const error = handleError(err);
      cb({ error });
    }
  };

  socket.on("private message", privateMessage);
  socket.on("get previous messages", getMessages);
};
