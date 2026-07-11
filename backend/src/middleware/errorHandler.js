export default (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'ServerError',
    message: err.message || 'Internal server error',
    details: err.details || [],
  });
};
