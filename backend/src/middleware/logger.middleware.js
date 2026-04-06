const prisma = require("../utils/prisma");

/**
 * Middleware: log API requests to the database.
 * Attach after authenticateApiKey so req.apiKey is available.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - start;

    prisma.apiLog.create({
      data: {
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        apiKeyId: req.apiKey?.id ?? null,
      },
    }).catch(() => {}); // fire-and-forget
  });

  next();
}

module.exports = { requestLogger };
