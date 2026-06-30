export function errorHandler(err, req, res, next) {
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

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
