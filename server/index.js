const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const redis = require("redis");
const session = require("express-session");
const mongoose = require("mongoose");
const users = require("./routes/users");
const { signUp } = require("./routes/handleAuth");
const { addUser, getUser } = require("./users");

const server = http.createServer(app);

let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient();

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

const client = redis.createClient();

app.use(morgan("dev"));

mongoose.connect(
  "mongodb+srv://taher33:taher33@node-shop.rcpzm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (data) => console.log(data, "connected")
);

app.use(
  cors({
    origin: "http://localhost:3000/",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("hey there");
});
app.use("/users", users);

// function to wrap the express middleware
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);
//socket middleware
io.use(wrap(morgan("dev")));

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
  console.log(socket.id);
  signUp(io, socket);
};

//connection
io.on("connection", onConnection);

server.listen(5000, () => {
  console.log("listening on port:5000");
});
