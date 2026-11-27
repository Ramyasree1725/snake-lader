const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { requireFields } = require("../middleware/validate");

const router = express.Router();

router.post("/register", requireFields(["username", "email", "password"]), authController.register);
router.post("/login", requireFields(["email", "password"]), authController.login);
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
