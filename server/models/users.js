const mongoose = require("mongoose");

const userScehma = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: [3, "name must be longer then 3 chars"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("User", userScehma);
