const jwt = require("jsonwebtoken");
const User = require("../models/users");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { handleToken } = require("../utils/jwt-token");

const signToken = (data) => {
  return jwt.sign({ data }, process.env.JWT_SECRET || "cute cat", {
    expiresIn: process.env.JWT_EXPIRES_IN || 3600 * 1000 * 24,
  });
};

exports.signUp = (io, socket, client) => {
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

      client.lpush(
        "users",
        JSON.stringify({
          name: userName,
          email,
          socketId: socket.id,
          id: newUser._id,
        })
      );

      const usersString = await client.lrange("users", 0, -1);
      let users = usersString.map((user) => JSON.parse(user));
      users = users.filter((element) => element.id !== newUser._id);
      io.emit("user connecting", users);

      console.log("sign up");
    } catch (err) {
      cb({ error: "NOK" });
      // console.log(err);
      console.log("erooooor");
    }
  };
  const login = async (payload, cb) => {
    const { email, password } = payload;
    if (!email || !password) return cb({ error: "must specify all fields" });

    try {
      let user;
      let token;
      const usersString = await client.lrange("users", 0, -1);

      let users = usersString.map((user) => JSON.parse(user));
      user = users.filter((element) => element.email === email);

      if (user.length !== 0) {
        token = signToken({ id: user._id, email });
        return cb({ user: { name: user.name, email, id: user._id }, token });
      }

      user = await User.findOne({ email }).select("+password");
      if (!user) return cb({ error: "password or email are worng" });
      if (!(await comparePassword(password, user.password)))
        return cb({ error: "password or email are worng" });

      token = signToken({ id: user._id, email });
      cb({ user: { name: user.name, email, id: user._id }, token });
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

  const sendConnectedUsers = async (cb) => {
    try {
      handleToken(socket);
      const usersString = await client.lrange("users", 0, -1);
      let users = usersString.map((user) => JSON.parse(user));
      users = users.filter((element) => element.id !== socket.user.id);
      cb(users);
    } catch (err) {
      console.log(err);
    }
  };

  socket.on("signup", signup);
  socket.on("connect to server", sendConnectedUsers);
  socket.on("login", login);
};
