const router = require("express").Router();
const controller = require("../controllers/analytics.controller");
const { authenticateJWT } = require("../middleware/auth.middleware");

router.get("/summary", authenticateJWT, controller.getSummary);

module.exports = router;
