const assert = require("assert");
const { LADDERS, SNAKES, rollSecureDice, applyMove } = require("../utils/gameEngine");

function testDiceRange() {
  for (let i = 0; i < 100; i++) {
    const val = rollSecureDice();
    assert(val >= 1 && val <= 6, `Dice value out of range: ${val}`);
  }
}

function testBoardTables() {
  assert.strictEqual(LADDERS[2], 38);
  assert.strictEqual(LADDERS[28], 84);
  assert.strictEqual(SNAKES[99], 54);
  assert.strictEqual(SNAKES[87], 24);
}

function testExactHundredRule() {
  const room = {
    turnIndex: 0,
    consecutiveSixes: 0,
    status: "playing",
    winner: null,
    players: [
      { name: "Alice", position: 98 },
      { name: "Bob", position: 10 }
    ]
  };
  const move = applyMove(room, false);
  if (move.roll > 2) {
    assert.strictEqual(room.players[0].position, 98, "Should stay at 98 when roll exceeds 100");
    assert.strictEqual(room.winner, null);
  } else if (move.roll === 2) {
    assert.strictEqual(room.players[0].position, 100);
    assert.strictEqual(room.winner, "Alice");
  }
}

function testTurnProgression() {
  const room = {
    turnIndex: 0,
    consecutiveSixes: 0,
    status: "playing",
    winner: null,
    players: [
      { name: "P1", position: 0 },
      { name: "P2", position: 0 }
    ]
  };
  const move = applyMove(room, false);
  assert(move.finalPos >= 1 && move.finalPos <= 38, "First move should be valid");
  assert.strictEqual(room.turnIndex, 1, "Turn should advance when extraSix is false");
}

function runAll() {
  testDiceRange();
  testBoardTables();
  testExactHundredRule();
  testTurnProgression();
  console.log("All backend gameEngine unit tests passed.");
}

runAll();
