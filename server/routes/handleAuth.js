const redis = require("redis");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

const client = redis.createClient();

const signToken = (data) => {
  return jwt.sign({ data }, process.env.JWT_SECRET || "cute cat", {
    expiresIn: process.env.JWT_EXPIRES_IN || 3600 * 1000 * 24,
  });
};

exports.signUp = (io, socket) => {
  const signup = async (payload, cb) => {
    const { userName, password, email } = payload;
    if (!userName || !password || !email)
      return cb({ error: "must specify all fields" });
    const hashedPassword = await hashPassword(password);
    try {
      const newUser = await User.create({
        name: userName,
        email,
        password: hashedPassword,
      });
      //creating the token jwt
      const token = signToken({ id: newUser._id, email });
      //sending the token for the user
      cb({ user: { name: userName, email, id: newUser._id }, token });
      socket.handshake.session.user = {
        name: userName,
        email,
        id: newUser._id,
      };

      client.lpush(
        "users",
        JSON.stringify({
          name: userName,
          email,
          socketId: socket.id,
          id: newUser._id,
        })
      );
      client.lrange("users", 0, -1, (err, usersString) => {
        let users = usersString.map((user) => JSON.parse(user));
        users = users.filter((element) => element.id !== socket.user.id);
        io.emit("user connecting", users);
      });
      console.log("sign up");
    } catch (err) {
      cb({ error: "NOK" });
      console.log(err);
    }
  };
  const login = async (payload, cb) => {
    const { email, password } = payload;
    console.log(payload);
    if (!email || !password) return cb({ error: "must specify all fields" });

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) return cb({ error: "password or email are worng" });
      if (!(await comparePassword(password, user.password)))
        return cb({ error: "password or email are worng" });

      const token = signToken({ id: user._id, email });
      cb({ user: { name: userName, email, id: user._id }, token });
      client.lpush(
        "users",
        JSON.stringify({
          name: user.name,
          email,
          socketId: socket.id,
          id: user._id,
        })
      );
      console.log("login success");
    } catch (err) {
      cb({ error: "NOK" });
      console.log(err);
    }
  };

  const sendConnectedUsers = () => {
    client.lrange("users", 0, -1, (err, usersString) => {
      let users = usersString.map((user) => JSON.parse(user));
      users = users.filter((element) => element.id !== socket.user.id);
      io.emit("user connecting", users);
    });
  };

  socket.on("signup", signup);
  socket.on("connect", sendConnectedUsers);
  socket.on("login", login);
};
