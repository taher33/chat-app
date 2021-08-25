exports.signUp = (io, socket) => {
  const signup = (payload) => {
    console.log("signup");
  };

  socket.on("signup", signup);
};
