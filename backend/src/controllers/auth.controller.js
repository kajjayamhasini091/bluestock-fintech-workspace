const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../utils/prisma");
const { signToken } = require("../utils/jwt");

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: passwordHash, name },
    });

    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
};

// POST /api/v1/auth/api-keys  (requires JWT)
exports.createApiKey = async (req, res) => {
  const { label } = req.body;
  const userId = req.user.userId;

  try {
    const key = `addr_${uuidv4().replace(/-/g, "")}`;
    const secret = uuidv4().replace(/-/g, "");
    const secretHash = await bcrypt.hash(secret, 10);

    const apiKey = await prisma.apiKey.create({
      data: { key, secretHash, label, userId },
    });

    // Return the secret ONCE — it won't be retrievable again
    res.status(201).json({
      id: apiKey.id,
      key: apiKey.key,
      secret,  // shown only on creation
      label: apiKey.label,
      createdAt: apiKey.createdAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to create API key" });
  }
};

// GET /api/v1/auth/api-keys  (requires JWT)
exports.listApiKeys = async (req, res) => {
  const userId = req.user.userId;
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, key: true, label: true, isActive: true, createdAt: true, lastUsedAt: true },
    });
    res.json(keys);
  } catch {
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
};

// DELETE /api/v1/auth/api-keys/:id  (requires JWT)
exports.revokeApiKey = async (req, res) => {
  const userId = req.user.userId;
  const keyId = parseInt(req.params.id);

  try {
    const record = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!record) return res.status(404).json({ error: "API key not found" });

    await prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } });
    res.json({ message: "API key revoked" });
  } catch {
    res.status(500).json({ error: "Failed to revoke API key" });
  }
};
