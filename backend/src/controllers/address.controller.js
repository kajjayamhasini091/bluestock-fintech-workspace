const prisma = require("../utils/prisma");
const { getCache, setCache } = require("../utils/redis");

const CACHE_TTL = 86400; // 24 hours — geographic data rarely changes

// GET /api/v1/countries
exports.getCountries = async (req, res) => {
  const cacheKey = "countries:all";
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
    await setCache(cacheKey, countries, CACHE_TTL);
    res.json(countries);
  } catch {
    res.status(500).json({ error: "Failed to fetch countries" });
  }
};

// GET /api/v1/states?countryId=1
exports.getStates = async (req, res) => {
  const countryId = req.query.countryId ? parseInt(req.query.countryId) : undefined;
  const cacheKey = `states:country:${countryId ?? "all"}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const states = await prisma.state.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { name: "asc" },
    });
    await setCache(cacheKey, states, CACHE_TTL);
    res.json(states);
  } catch {
    res.status(500).json({ error: "Failed to fetch states" });
  }
};

// GET /api/v1/districts?stateId=1
exports.getDistricts = async (req, res) => {
  const stateId = req.query.stateId ? parseInt(req.query.stateId) : undefined;
  const cacheKey = `districts:state:${stateId ?? "all"}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const districts = await prisma.district.findMany({
      where: stateId ? { stateId } : undefined,
      orderBy: { name: "asc" },
    });
    await setCache(cacheKey, districts, CACHE_TTL);
    res.json(districts);
  } catch {
    res.status(500).json({ error: "Failed to fetch districts" });
  }
};

// GET /api/v1/sub-districts?districtId=1
exports.getSubDistricts = async (req, res) => {
  const districtId = req.query.districtId ? parseInt(req.query.districtId) : undefined;
  const cacheKey = `subdistricts:district:${districtId ?? "all"}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const subDistricts = await prisma.subDistrict.findMany({
      where: districtId ? { districtId } : undefined,
      orderBy: { name: "asc" },
    });
    await setCache(cacheKey, subDistricts, CACHE_TTL);
    res.json(subDistricts);
  } catch {
    res.status(500).json({ error: "Failed to fetch sub-districts" });
  }
};

// GET /api/v1/villages?subDistrictId=1&search=agra&page=1&limit=20
exports.getVillages = async (req, res) => {
  const subDistrictId = req.query.subDistrictId ? parseInt(req.query.subDistrictId) : undefined;
  const search = req.query.search?.trim();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  // Don't cache search queries — too many permutations
  const cacheKey = !search ? `villages:sub:${subDistrictId ?? "all"}:p${page}:l${limit}` : null;
  if (cacheKey) {
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);
  }

  try {
    const where = {
      ...(subDistrictId ? { subDistrictId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };

    const [villages, total] = await Promise.all([
      prisma.village.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
      prisma.village.count({ where }),
    ]);

    const result = {
      data: villages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    if (cacheKey) await setCache(cacheKey, result, 3600);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch villages" });
  }
};

// GET /api/v1/villages/:code  — lookup single village by MDDS code
exports.getVillageByCode = async (req, res) => {
  const { code } = req.params;
  const cacheKey = `village:code:${code}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const village = await prisma.village.findUnique({
      where: { code },
      include: {
        subDistrict: {
          include: {
            district: {
              include: {
                state: { include: { country: true } },
              },
            },
          },
        },
      },
    });

    if (!village) return res.status(404).json({ error: "Village not found" });
    await setCache(cacheKey, village, CACHE_TTL);
    res.json(village);
  } catch {
    res.status(500).json({ error: "Failed to fetch village" });
  }
};
