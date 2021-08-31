const express = require("express");
const redis = require("redis");
const User = require("../models/users");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const router = express.Router();

const client = redis.createClient();

router.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.json({ err: "must specify all fields" });
  const hashedPassword = await hashPassword(password);
  try {
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    req.session.userId = newUser._id;

    res.json({ newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ err: "must specify email and password" });
  console.log(req.session.userId);
  try {
    const client = await User.findOne({ email }).select("+password");
    if (!client) return res.status(404).json({ err: "user does not exist" });
    if (!(await comparePassword(password, client.password))) {
      return res.status(400).json({ err: "wrong password" });
    }
    req.session.userId = client._id;

    res.json({ client });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err });
  }
});

module.exports = router;
