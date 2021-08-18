const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { addUser, getUser } = require("./users");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3000/",
  })
);

app.get("/", (req, res) => {
  res.send("hey there");
});

io.on("connection", (socket) => {
  socket.on("room", ({ room, name }) => {
    const { error, success } = addUser({ id: socket.id, name, room });
    console.log("error", error);
    console.log("success", success);
    socket.join("room");
  });
  // io.of("/").adapter.on("join-room", (room, id) => {
  //   console.log(`socket ${id} has joined room ${room}`);
  // });
  socket.on("message", ({ name, message }) => {
    const user = getUser(name);

    socket.to(user.id).emit("message", message);
  });
});

server.listen(5000, () => {
  console.log("listening on port:5000");
});
