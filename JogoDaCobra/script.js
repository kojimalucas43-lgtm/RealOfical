const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, direction, food, score, game;

// elementos do menu
const gameOverMenu = document.getElementById("gameOverMenu");
const finalScoreEl = document.getElementById("finalScore");
const highScoreEl = document.getElementById("highScore");

function startGame() {
  snake = [{ x: 10 * box, y: 10 * box }];
  direction = "RIGHT";
  food = spawnFood();
  score = 0;

  document.getElementById("score").innerText = score;
  gameOverMenu.classList.add("hidden");

  if (game) clearInterval(game);
  game = setInterval(draw, 120);
}

document.addEventListener("keydown", changeDirection);

function spawnFood() {
  return {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box
  };
}

function changeDirection(event) {
  if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? "lime" : "green";
    ctx.fillRect(part.x, part.y, box, box);
  });

  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "LEFT") headX -= box;
  if (direction === "UP") headY -= box;
  if (direction === "RIGHT") headX += box;
  if (direction === "DOWN") headY += box;

  if (headX === food.x && headY === food.y) {
    score++;
    document.getElementById("score").innerText = score;
    food = spawnFood();
  } else {
    snake.pop();
  }

  const newHead = { x: headX, y: headY };

  if (
    headX < 0 ||
    headY < 0 ||
    headX >= canvas.width ||
    headY >= canvas.height ||
    collision(newHead, snake)
  ) {
    endGame();
    return;
  }

  snake.unshift(newHead);
}

function collision(head, body) {
  return body.some(part => part.x === head.x && part.y === head.y);
}

// 💀 FINAL DO JOGO COM MENU
function endGame() {
  clearInterval(game);

  let highScore = localStorage.getItem("snakeHighScore") || 0;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("snakeHighScore", highScore);
  }

  finalScoreEl.innerText = score;
  highScoreEl.innerText = highScore;

  gameOverMenu.classList.remove("hidden");
}

// 🔄 RESET
function resetGame() {
  startGame();
}

// iniciar
startGame();