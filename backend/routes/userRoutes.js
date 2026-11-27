const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");
const { requireFields } = require("../middleware/validate");

const router = express.Router();

router.get("/profile", requireAuth, userController.getProfile);
router.put("/profile", requireAuth, userController.updateProfile);
router.post("/rewards/daily", requireAuth, userController.claimDailyReward);
router.get("/shop", userController.getShopItems);
router.post("/shop/equip", requireAuth, requireFields(["skinId"]), userController.unlockOrEquipSkin);
router.get("/friends", requireAuth, userController.getFriends);
router.post("/friends/request", requireAuth, requireFields(["username"]), userController.sendFriendRequest);

module.exports = router;
