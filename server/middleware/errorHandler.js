export function errorHandler(err, req, res, next) {
  console.error("Unhandled Error:", err);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: {
        message: messages.join(", ") || "Validation failed",
      },
    });
  }

  // Mongoose invalid ObjectId / CastError
  if (err.name === "CastError") {
    return res.status(400).json({
      error: {
        message: "Invalid resource identifier format",
      },
    });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.statusCode ? err.message : "Something went wrong";

  res.status(statusCode).json({
    error: {
      message,
    },
  });
}
