const express = require("express");
const gameController = require("../controllers/gameController");

function createGameRouter(rooms) {
  const router = express.Router();

  router.get("/boards", gameController.getBoardConfigs);
  router.get("/leaderboard", gameController.getLeaderboard);
  router.get("/matches/history", gameController.getMatchHistory);
  router.post("/games/create", gameController.createRestGame(rooms));
  router.post("/games/join", gameController.joinRestGame(rooms));
  router.get("/games/:id", gameController.getRestGame(rooms));
  router.post("/games/:id/move", gameController.submitRestMove(rooms));

  return router;
}

module.exports = createGameRouter;
