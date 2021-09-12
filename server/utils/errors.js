const handleCastErr = (err) => {
  const message = `invalide ${err.path}: ${err.value}`;
  return { message };
};
const handleDuplicateErr = (err) => {
  const value = Object.keys(err.keyValue)[0];
  const message = `${value} already exists`;
  console.log(message);
  return { message };
};

const handleValdiationErr = (err) => {
  let errors = Object.values(err.errors).map((el) => {
    return { message: el.message, field: el.path };
  });
  return { message: "validation err", errors };
};

const hendleJWTerr = () => ({ message: "login again please" });

exports.handleError = (err) => {
  let error = { message: "NOK" };
  if (err.name === "CastError") error = handleCastErr(err);
  if (err.code === 11000) error = handleDuplicateErr(err);
  if (
    err.message.match("validation failed") ||
    err.name.match("ValidationError")
  )
    error = handleValdiationErr(err);
  if (err.name === "JsonWebTokenError") error = hendleJWTerr();
  if (err.name === "TokenExpiredError") error = hendleJWTerr();
  return error;
};
