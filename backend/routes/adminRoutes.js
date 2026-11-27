const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { requireFields } = require("../middleware/validate");

const router = express.Router();

router.post("/feedback", requireFields(["subject", "message"]), adminController.submitFeedback);
router.get("/admin/stats", requireAuth, requireAdmin, adminController.getAdminStats);
router.get("/admin/users", requireAuth, requireAdmin, adminController.listUsers);
router.patch("/admin/users/:id/ban", requireAuth, requireAdmin, adminController.toggleUserBan);
router.get("/admin/feedback", requireAuth, requireAdmin, adminController.listFeedback);
router.patch("/admin/feedback/:id", requireAuth, requireAdmin, adminController.resolveFeedback);

module.exports = router;
