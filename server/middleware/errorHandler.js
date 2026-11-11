export function errorHandler(err, req, res, next) {
  console.error("Unhandled Error:", err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.statusCode ? err.message : "Something went wrong";

  res.status(statusCode).json({
    error: {
      message,
    },
  });
}
