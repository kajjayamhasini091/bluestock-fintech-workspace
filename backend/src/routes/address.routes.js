const router = require("express").Router();
const controller = require("../controllers/address.controller");
const { authenticateApiKey } = require("../middleware/auth.middleware");
const { requestLogger } = require("../middleware/logger.middleware");

// All address routes require a valid API key
router.use(authenticateApiKey, requestLogger);

router.get("/countries", controller.getCountries);
router.get("/states", controller.getStates);
router.get("/districts", controller.getDistricts);
router.get("/sub-districts", controller.getSubDistricts);
router.get("/villages", controller.getVillages);
router.get("/villages/:code", controller.getVillageByCode);

module.exports = router;
