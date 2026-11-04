const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const leftScoreEl = document.getElementById('left-score');
const rightScoreEl = document.getElementById('right-score');
const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

const WINNING_SCORE = 7;
const leftPaddle = {
  width: 13,
  height: 108,
  x: 24,
  y: canvas.height / 2 - 54,
  speed: 7,
};
const rightPaddle = {
  width: 13,
  height: 108,
  x: canvas.width - 37,
  y: canvas.height / 2 - 54,
  speed: 7,
};
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 9,
  vx: 5,
  vy: 2,
};

const keys = new Set();
let leftScore = 0;
let rightScore = 0;
let playing = false;
let audioContext = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function playTone(frequency, duration = 0.08, type = 'sine', volume = 0.045) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playScoreSound() {
  playTone(660, 0.12, 'triangle', 0.055);
  window.setTimeout(() => playTone(880, 0.16, 'triangle', 0.045), 100);
}

function updateScore() {
  leftScoreEl.textContent = leftScore;
  rightScoreEl.textContent = rightScore;
}

function serve(direction = Math.random() < 0.5 ? -1 : 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx = 5 * direction;
  ball.vy = (Math.random() * 4) - 2;
}

function resetGame() {
  leftScore = 0;
  rightScore = 0;
  leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
  rightPaddle.y = canvas.height / 2 - rightPaddle.height / 2;
  keys.clear();
  updateScore();
  serve(1);
  playing = false;
  overlayTitle.textContent = '准备好了吗？';
  overlayMessage.textContent = `先得 ${WINNING_SCORE} 分获胜！`;
  startButton.textContent = '开始游戏';
  overlay.classList.remove('is-hidden');
  draw();
}

async function startGame() {
  if (playing) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass && !audioContext) audioContext = new AudioContextClass();
  if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
  playing = true;
  keys.clear();
  overlay.classList.add('is-hidden');
  playTone(520, 0.12, 'triangle', 0.04);
}

function endGame(winner) {
  playing = false;
  keys.clear();
  overlayTitle.textContent = `${winner} 获胜！`;
  overlayMessage.textContent = `最终比分 ${leftScore} : ${rightScore}`;
  startButton.textContent = '再玩一次';
  overlay.classList.remove('is-hidden');
  playScoreSound();
}

function movePaddles() {
  if (keys.has('w')) leftPaddle.y -= leftPaddle.speed;
  if (keys.has('s')) leftPaddle.y += leftPaddle.speed;
  if (keys.has('arrowup')) rightPaddle.y -= rightPaddle.speed;
  if (keys.has('arrowdown')) rightPaddle.y += rightPaddle.speed;

  leftPaddle.y = clamp(leftPaddle.y, 0, canvas.height - leftPaddle.height);
  rightPaddle.y = clamp(rightPaddle.y, 0, canvas.height - rightPaddle.height);
}

function bounceFromPaddle(paddle, direction) {
  const relativeHit = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
  const angle = relativeHit * 1.05;
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) + 0.25, 10);
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
  playTone(300 + Math.abs(relativeHit) * 220, 0.055, 'square', 0.025);
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
    ball.vy *= -1;
    ball.y = clamp(ball.y, ball.radius, canvas.height - ball.radius);
    playTone(190, 0.04, 'sine', 0.02);
  }

  if (
    ball.vx < 0 &&
    ball.x - ball.radius <= leftPaddle.x + leftPaddle.width &&
    ball.x + ball.radius >= leftPaddle.x &&
    ball.y + ball.radius >= leftPaddle.y &&
    ball.y - ball.radius <= leftPaddle.y + leftPaddle.height
  ) {
    ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
    bounceFromPaddle(leftPaddle, 1);
  }

  if (
    ball.vx > 0 &&
    ball.x + ball.radius >= rightPaddle.x &&
    ball.x - ball.radius <= rightPaddle.x + rightPaddle.width &&
    ball.y + ball.radius >= rightPaddle.y &&
    ball.y - ball.radius <= rightPaddle.y + rightPaddle.height
  ) {
    ball.x = rightPaddle.x - ball.radius;
    bounceFromPaddle(rightPaddle, -1);
  }

  if (ball.x + ball.radius < 0) {
    rightScore += 1;
    updateScore();
    playScoreSound();
    if (rightScore >= WINNING_SCORE) {
      endGame('玩家 2');
    } else {
      serve(-1);
    }
  } else if (ball.x - ball.radius > canvas.width) {
    leftScore += 1;
    updateScore();
    playScoreSound();
    if (leftScore >= WINNING_SCORE) {
      endGame('玩家 1');
    } else {
      serve(1);
    }
  }
}

function drawCenterLine() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCenterLine();

  ctx.fillStyle = '#8dffcf';
  ctx.shadowColor = '#8dffcf';
  ctx.shadowBlur = 14;
  ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  ctx.fillStyle = '#a9b8ff';
  ctx.shadowColor = '#a9b8ff';
  ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  ctx.beginPath();
  ctx.fillStyle = '#ffcf70';
  ctx.shadowColor = '#ffcf70';
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function gameLoop() {
  if (playing) {
    movePaddles();
    updateBall();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => keys.clear());
startButton.addEventListener('click', () => startGame());
restartButton.addEventListener('click', resetGame);

updateScore();
serve(1);
draw();
requestAnimationFrame(gameLoop);
