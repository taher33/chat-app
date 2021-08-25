const bcrypt = require("bcryptjs");

exports.hashPassword = async (password) => {
  const newPass = await bcrypt.hash(password, 13);
  return newPass;
};

exports.comparePassword = async (candidate, password) => {
  return await bcrypt.compare(candidate, password);
};
