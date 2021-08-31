const Messages = require("../models/messages");
const Users = require("../models/users");
const jwt = require("jsonwebtoken");
module.exports = (io, socket, client) => {
  function privateMessage(payload, cb) {
    handleToken();
    console.log("private message", socket.user);
    if (!socket.user) return console.log("login");

    const { email, message } = payload;
    client.lrange("users", 0, -1, (err, usersString) => {
      console.log("redis error", err);
      let recieverId = undefined;
      const users = usersString.map((user) => JSON.parse(user));
      const user = users.filter((user) => user.email === email);
      // TODO : check if this works down here
      if (user.length !== 0) {
        console.log("user", user);
        recieverId = user[0].id;
        socket.to(user[0].socketId).emit("private message", message);
      } else {
        Users.find({ email })
          .then((user) => {
            recieverId = user._id;
          })
          .catch((err) => console.log(err));
      }

      //todo: make the error handler for this

      if (!recieverId) return console.log("user does not exist");
      console.log("made it here");
      Messages.create({
        sender: socket.user.data.id,
        content: message,
        reciever: recieverId,
      })
        .then(() => console.log("message created"))
        .catch((err) => console.log(err));
    });
  }

  const getMessages = async (payload, cb) => {
    const selectedUserID = payload.id;
    handleToken();
    console.log("get message", socket.user);

    let prevMessages = [];
    try {
      prevMessages.push(
        ...(await Messages.find({
          sender: selectedUserID,
          reciever: socket.user.data.id,
        }))
      );
      prevMessages.push(
        ...(await Messages.find({
          reciever: selectedUserID,
          sender: socket.user.data.id,
        }))
      );
      cb({ message: prevMessages });
      console.log(prevMessages);
    } catch (error) {
      cb({ error: "NOK" });
      console.log(error);
    }
  };

  const handleToken = async () => {
    const token = socket.handshake.auth.token;
    console.log(socket.handshake.auth, "token");
    try {
      if (!token || token === "abcd")
        return socket.emit("connect_error", "not authorized");
      const decoded = jwt.verify(token, "cute cat");
      socket.user = decoded;
    } catch (err) {
      console.error("err");
      socket.emit("connect_error", "NOK");
    }
  };
  socket.on("private message", privateMessage);
  socket.on("get previous messages", getMessages);
};
