const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const redis = require("redis");
const session = require("express-session");
const sharedSession = require("express-socket.io-session");
const mongoose = require("mongoose");
const users = require("./routes/users");
const { signUp } = require("./routes/handleAuth");
const handlechat = require("./routes/handlechat");

const server = http.createServer(app);

const dotenv = require("dotenv").config({
  path: "./config.env",
});

let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient();

app.use(express.json());
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    name: "jid",
    secret: "keyboard cat",
    resave: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 3600 * 24 * 2, //2 days
    },
  })
);

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
io.use(
  sharedSession(
    session({
      store: new RedisStore({ client: redisClient }),
      saveUninitialized: false,
      name: "jid",
      secret: "keyboard cat",
      resave: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 3600 * 24 * 2, //2 days
      },
    })
  )
);

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
  signUp(io, socket);
  handlechat(io, socket, redisClient);
};

//connection
io.on("connection", onConnection);

server.listen(5000, () => {
  console.log("listening on port:5000");
});
