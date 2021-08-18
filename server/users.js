const users = [];
const addUser = ({ id, name, room }) => {
  name.trim().toLowerCase();
  room.trim().toLowerCase();

  if (!name || !room) return { error: "must specify name and a room" };
  const existingUser = users.findIndex((el) => el.name === name);
  if (existingUser !== -1) return { error: "user already exists" };
  users.push({ id, name, room });

  return {
    success: true,
  };
};
const getUser = (name) => users.find((user) => user.name === name);

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = { addUser, getUser, getUsersInRoom };
