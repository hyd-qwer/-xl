const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const leftScoreEl = document.getElementById('left-score');
const rightScoreEl = document.getElementById('right-score');

const leftPaddle = {
  width: 12,
  height: 110,
  x: 20,
  y: canvas.height / 2 - 55,
  speed: 7,
};

const rightPaddle = {
  width: 12,
  height: 110,
  x: canvas.width - 32,
  y: canvas.height / 2 - 55,
  speed: 5.2,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 9,
  vx: 5,
  vy: 4,
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
};

let leftScore = 0;
let rightScore = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetBall(direction = 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;

  const angle = (Math.random() * 1.2 - 0.6);
  ball.vx = 5 * direction;
  ball.vy = 4 * angle;
}

function updateScore() {
  leftScoreEl.textContent = leftScore;
  rightScoreEl.textContent = rightScore;
}

function handleKeyboard() {
  if (keys.ArrowUp) {
    leftPaddle.y -= leftPaddle.speed;
  }
  if (keys.ArrowDown) {
    leftPaddle.y += leftPaddle.speed;
  }

  leftPaddle.y = clamp(leftPaddle.y, 0, canvas.height - leftPaddle.height);
}

function updateComputer() {
  const paddleCenter = rightPaddle.y + rightPaddle.height / 2;

  if (paddleCenter < ball.y - 25) {
    rightPaddle.y += rightPaddle.speed;
  } else if (paddleCenter > ball.y + 25) {
    rightPaddle.y -= rightPaddle.speed;
  }

  rightPaddle.y = clamp(rightPaddle.y, 0, canvas.height - rightPaddle.height);
}

function detectPaddleCollision() {
  if (
    ball.x - ball.radius <= leftPaddle.x + leftPaddle.width &&
    ball.x + ball.radius >= leftPaddle.x &&
    ball.y >= leftPaddle.y &&
    ball.y <= leftPaddle.y + leftPaddle.height &&
    ball.vx < 0
  ) {
    const collidePoint = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
    const bounceAngle = collidePoint * 1.1;

    ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
    ball.vx = Math.abs(ball.vx) + 0.4;
    ball.vy = ball.vy + bounceAngle * 3;
  }

  if (
    ball.x + ball.radius >= rightPaddle.x &&
    ball.x - ball.radius <= rightPaddle.x + rightPaddle.width &&
    ball.y >= rightPaddle.y &&
    ball.y <= rightPaddle.y + rightPaddle.height &&
    ball.vx > 0
  ) {
    const collidePoint = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
    const bounceAngle = collidePoint * 1.1;

    ball.x = rightPaddle.x - ball.radius;
    ball.vx = -(Math.abs(ball.vx) + 0.4);
    ball.vy = ball.vy + bounceAngle * 3;
  }
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
    ball.vy *= -1;
    ball.y = clamp(ball.y, ball.radius, canvas.height - ball.radius);
  }

  if (ball.x < 0) {
    rightScore += 1;
    updateScore();
    resetBall(1);
  }

  if (ball.x > canvas.width) {
    leftScore += 1;
    updateScore();
    resetBall(-1);
  }

  detectPaddleCollision();
}

function drawCenterLine() {
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(x, y, width, height) {
  ctx.fillStyle = '#ecf2ff';
  ctx.fillRect(x, y, width, height);
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = '#ffcc66';
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCenterLine();
  drawPaddle(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  drawPaddle(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
  drawBall();
}

function gameLoop() {
  handleKeyboard();
  updateComputer();
  updateBall();
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    keys[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    keys[event.key] = false;
  }
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = event.clientY - rect.top;
  leftPaddle.y = clamp(mouseY - leftPaddle.height / 2, 0, canvas.height - leftPaddle.height);
});

updateScore();
resetBall(1);
requestAnimationFrame(gameLoop);
