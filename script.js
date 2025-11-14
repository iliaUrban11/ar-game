let scores = { nerv: 0, anx: 0, stress: 0 };
let sceneEl, modelsGroup, gameTimer;
let timeLeft = 30;
let gameActive = false;

const startPage = document.getElementById('startPage');
const gameUI = document.getElementById('gameUI');
const endScreen = document.getElementById('endScreen');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', () => location.reload());

function startGame() {
  startPage.style.display = 'none';
  gameUI.style.display = 'block';
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');
  sceneEl.style.display = 'block';

  scores = { nerv: 0, anx: 0, stress: 0 };
  timeLeft = 30;
  gameActive = true;
  updateScales();

  if (sceneEl.hasLoaded) initAR();
  else sceneEl.addEventListener('loaded', initAR);

  gameTimer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(gameTimer);
  modelsGroup.innerHTML = '';

  setTimeout(() => {
    document.getElementById('nerv-result').innerHTML   = `Нервозность: <b>${scores.nerv}</b>`;
    document.getElementById('anx-result').innerHTML    = `Тревога: <b>${scores.anx}</b>`;
    document.getElementById('stress-result').innerHTML = `Стресс: <b>${scores.stress}</b>`;

    setTimeout(() => {
      document.getElementById('end-nerv-fill').style.width   = Math.min(scores.nerv * 10, 100) + '%';
      document.getElementById('end-anx-fill').style.width    = Math.min(scores.anx * 10, 100) + '%';
      document.getElementById('end-stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
    }, 300);

    gameUI.style.display = 'none';
    endScreen.style.display = 'flex';
  }, 800);
}

function initAR() {
  spawnAllModels();
}

function spawnAllModels() {
  const types = ['nerv', 'anx', 'stress'];
  types.forEach(type => {
    for (let i = 0; i < 10; i++) spawnModel(type);
  });
}

function spawnModel(type) {
  if (!gameActive) return;

  const el = document.createElement('a-entity');
  el.setAttribute('gltf-model', `#${type}`);
  el.setAttribute('data-color', type);
  el.classList.add('clickable');

  const scale = 0.15 + Math.random() * 0.45;
  el.setAttribute('scale', `${scale} ${scale} ${scale}`);

  // СФЕРИЧЕСКОЕ РАСПРЕДЕЛЕНИЕ: 3–10 м, 100° по горизонтали, ±30° по вертикали
  const distance = 3 + Math.random() * 7;
  const yaw   = (Math.random() * 100 - 50) * Math.PI / 180;   // -50° … +50°
  const pitch = (Math.random() * 60 - 30) * Math.PI / 180;    // -30° … +30°

  const x = Math.sin(yaw) * Math.cos(pitch) * distance;
  const y = Math.sin(pitch) * distance + 1.2;
  const z = -Math.cos(yaw) * Math.cos(pitch) * distance;

  el.setAttribute('position', `${x} ${y} ${z}`);

  // ВАЖНО: модель всегда смотрит на игрока
  el.setAttribute('look-at', '[camera]');

  el.addEventListener('click', () => {
    if (!gameActive) return;
    scores[type]++;
    updateScales();
    el.remove();
  });

  modelsGroup.appendChild(el);
}

function updateScales() {
  document.getElementById('nerv-fill').style.width   = Math.min(scores.nerv * 10, 100) + '%';
  document.getElementById('anx-fill').style.width    = Math.min(scores.anx * 10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
}
