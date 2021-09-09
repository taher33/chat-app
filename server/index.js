const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const redis = require("redis");
const mongoose = require("mongoose");
const users = require("./routes/users");
const { signUp } = require("./routes/handleAuth");
const handlechat = require("./routes/handlechat");
const asyncRedis = require("async-redis");

const server = http.createServer(app);

const dotenv = require("dotenv").config({
  path: "./config.env",
});
const client = asyncRedis.createClient();

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

mongoose.connect(
  `mongodb+srv://taher33:${process.env.MONGO_PASS}@node-shop.rcpzm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (data) => console.log(data, "connected")
);

app.get("/", (req, res) => {
  res.send("hey there");
});
app.use("/users", users);

// function to wrap the express middleware
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);
//socket middleware

// io.on("connection", (socket) => {
//   client.lrange("user", 0, -1, (err, user) => {
//     console.log("user", user);
//   });

//   // socket.on("login", { email, password });

//   socket.on("join room", ({ room, name }) => {
//     const { error, success } = addUser({ id: socket.id, name, room });
//     console.log("error", error);
//     console.log("success", success);
//     socket.join("room");
//   });

//   socket.on("message", ({ name, message }) => {
//     const user = getUser(name);

//     socket.to(user.id).emit("message", message);
//   });
// });

//functions
const onConnection = (socket) => {
  signUp(io, socket, client);
  handlechat(io, socket, client);

  io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
  });
};

//connection
io.on("connection", onConnection);

server.listen(5000, () => {
  console.log("listening on port:5000");
});
