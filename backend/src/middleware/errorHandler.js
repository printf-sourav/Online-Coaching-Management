const errorHandler = (err, req, res, next) => {
  console.error(err instanceof Error ? err.stack : err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};
export default errorHandler;
