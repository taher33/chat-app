const redis = require("redis");
const User = require("../models/users");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

const client = redis.createClient();

exports.signUp = (io, socket) => {
  const signup = async (payload, cb) => {
    const { userName, password, email } = payload;
    const hashedPassword = await hashPassword(password);
    try {
      const newUser = await User.create({
        name: userName,
        email,
        password: hashedPassword,
      });
      cb({ user: { name: userName, email } });
      socket.request.session.user = { name: userName, email };
      socket.request.session.save();
      client.lpush("users", JSON.stringify({ name: userName, email }));
    } catch (err) {
      console.error(err);
      cb({ error: "NOK" });
    }
  };
  const login = async (payload) => {
    const { email, password } = payload;

    if (!email || !password) return;
    try {
      const client = await User.findOne({ email }).select("+password");
      if (!client) return;
      if (!(await comparePassword(password, client.password))) return;

      socket.request.session.user = { name: userName, email };

      client.lpush("users", JSON.stringify({ name: userName, email }));
      // res.json({ client });
    } catch (error) {
      console.log(error);
    }
  };

  socket.on("signup", signup);
  socket.on("login", login);
};
