export function loggerMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
}