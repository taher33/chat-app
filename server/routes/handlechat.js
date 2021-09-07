const Messages = require("../models/messages");
const Users = require("../models/users");
const { handleToken } = require("../utils/jwt-token");

module.exports = (io, socket, client) => {
  async function privateMessage(payload, cb) {
    handleToken(socket);
    if (!socket.user.data.id) return cb({ error: "login please" }); //! should send an error to the client
    console.log(socket.user.data);
    const { email, message } = payload;
    try {
      const usersString = await client.lrange("users", 0, -1);

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
        console.log("messsaaaage", msg);
        socket.to(user[0].socketId).emit("private message", msg);
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
    } catch (error) {
      cb({ error: "NOK" });
      console.log(error);
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
      cb({ message: prevMessages });
    } catch (error) {
      cb({ error: "NOK" });
      console.log(error);
    }
  };

  socket.on("private message", privateMessage);
  socket.on("get previous messages", getMessages);
};
