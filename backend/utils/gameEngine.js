const crypto = require("crypto");

const LADDERS = {
  2: 38,
  7: 14,
  28: 84,
  51: 67,
  71: 91
};

const SNAKES = {
  16: 6,
  49: 11,
  62: 18,
  87: 24,
  99: 54
};

const PLAYER_COLORS = ["#00C9A7", "#FFC857", "#FF5C77", "#7357FF"];

function rollSecureDice() {
  return crypto.randomInt(1, 7);
}

function applyMove(room, extraSixEnabled = true) {
  const player = room.players[room.turnIndex];
  const roll = rollSecureDice();
  const prevPos = player.position;

  room.consecutiveSixes = roll === 6 ? (room.consecutiveSixes || 0) + 1 : 0;

  if (extraSixEnabled && room.consecutiveSixes >= 3) {
    room.consecutiveSixes = 0;
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    return {
      player: player.name,
      roll,
      from: prevPos,
      landed: prevPos,
      finalPos: prevPos,
      event: "forfeit-sixes",
      winner: null
    };
  }

  const target = prevPos + roll;
  if (target > 100) {
    const keepTurn = roll === 6 && extraSixEnabled;
    if (!keepTurn) {
      room.turnIndex = (room.turnIndex + 1) % room.players.length;
      room.consecutiveSixes = 0;
    }
    return {
      player: player.name,
      roll,
      from: prevPos,
      landed: prevPos,
      finalPos: prevPos,
      event: "exceeded-100",
      winner: null
    };
  }

  let finalPos = target;
  let event = "move";
  if (LADDERS[target]) {
    finalPos = LADDERS[target];
    event = "ladder";
  } else if (SNAKES[target]) {
    finalPos = SNAKES[target];
    event = "snake";
  }

  player.position = finalPos;

  if (finalPos === 100) {
    room.status = "finished";
    room.winner = player.name;
    return {
      player: player.name,
      roll,
      from: prevPos,
      landed: target,
      finalPos,
      event: "win",
      winner: player.name
    };
  }

  const keepTurn = roll === 6 && extraSixEnabled;
  if (!keepTurn) {
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    room.consecutiveSixes = 0;
  }

  return {
    player: player.name,
    roll,
    from: prevPos,
    landed: target,
    finalPos,
    event,
    winner: null
  };
}

module.exports = { LADDERS, SNAKES, PLAYER_COLORS, rollSecureDice, applyMove };
