const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const { authenticateJWT } = require("../middleware/auth.middleware");

router.post("/register", controller.register);
router.post("/login", controller.login);

// API key management — requires logged-in user
router.post("/api-keys", authenticateJWT, controller.createApiKey);
router.get("/api-keys", authenticateJWT, controller.listApiKeys);
router.delete("/api-keys/:id", authenticateJWT, controller.revokeApiKey);

module.exports = router;
