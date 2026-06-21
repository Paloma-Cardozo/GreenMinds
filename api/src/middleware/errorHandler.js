export function errorHandler(err, req, res, next) {
  console.error(err);

  let status = err.status;
  if (!status) {
    status = 500;
  }

  let message;
  if (status === 500) {
    message = "Internal server error";
  } else {
    message = err.message;
  }

  res.status(status).json({ error: message });
}
