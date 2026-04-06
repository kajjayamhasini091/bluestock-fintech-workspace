const { verifyToken } = require("../utils/jwt");
const prisma = require("../utils/prisma");

/**
 * Middleware: verify JWT bearer token.
 * Attaches req.user if valid.
 */
async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: verify X-API-Key header.
 * Attaches req.apiKey if valid.
 */
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Missing X-API-Key header" });
  }

  try {
    const record = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!record || !record.isActive) {
      return res.status(401).json({ error: "Invalid or inactive API key" });
    }

    // Update lastUsedAt (fire-and-forget)
    prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    req.apiKey = record;
    req.user = record.user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Authentication error" });
  }
}

module.exports = { authenticateJWT, authenticateApiKey };
