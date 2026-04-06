const prisma = require("../utils/prisma");

// GET /api/v1/analytics/summary  (requires JWT)
exports.getSummary = async (req, res) => {
  const userId = req.user.userId;

  try {
    const userApiKeyIds = await prisma.apiKey
      .findMany({ where: { userId }, select: { id: true } })
      .then((keys) => keys.map((k) => k.id));

    const [totalRequests, last24h, topEndpoints] = await Promise.all([
      prisma.apiLog.count({ where: { apiKeyId: { in: userApiKeyIds } } }),
      prisma.apiLog.count({
        where: {
          apiKeyId: { in: userApiKeyIds },
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
      prisma.apiLog.groupBy({
        by: ["endpoint"],
        where: { apiKeyId: { in: userApiKeyIds } },
        _count: { endpoint: true },
        orderBy: { _count: { endpoint: "desc" } },
        take: 5,
      }),
    ]);

    res.json({
      totalRequests,
      last24hRequests: last24h,
      topEndpoints: topEndpoints.map((e) => ({ endpoint: e.endpoint, count: e._count.endpoint })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
