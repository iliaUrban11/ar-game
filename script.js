let scores = { nerv: 0, anx: 0, stress: 0 };
let sceneEl, modelsGroup, gameTimer;
let timeLeft = 30;
let gameActive = false;
let occupiedPositions = [];

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
  occupiedPositions = [];
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
    for (let i = 0; i < 10; i++) {
      spawnModel(type);
    }
  });
}

function spawnModel(type) {
  if (!gameActive) return;

  const el = document.createElement('a-entity');
  el.setAttribute('gltf-model', `#${type}`);
  el.setAttribute('data-color', type);
  el.classList.add('clickable');

  const scale = 0.18 + Math.random() * 0.4;
  el.setAttribute('scale', `${scale} ${scale} ${scale}`);

  // === РАЗМЕЩЕНИЕ С МИНИМАЛЬНЫМИ ПЕРЕСЕЧЕНИЯМИ ===
  let x, y, z, attempts = 0;
  const minDist = 1.8;

  do {
    const distance = 3 + Math.random() * 7;
    const yaw      = (Math.random() * 100 - 50) * Math.PI / 180;   // ±50°
    const pitch    = (Math.random() * 140 - 70) * Math.PI / 180;   // ±70°

    x = Math.sin(yaw) * Math.cos(pitch) * distance;
    y = Math.sin(pitch) * distance + 1.5;
    z = -Math.cos(yaw) * Math.cos(pitch) * distance;

    attempts++;
  } while (isTooClose(x, y, z, minDist) && attempts < 100);

  el.setAttribute('position', `${x} ${y} ${z}`);
  occupiedPositions.push({ x, y, z });

  // === ВСЕГДА СМОТРИТ НА КАМЕРУ ===
  el.addEventListener('model-loaded', () => {
    const tick = () => {
      if (!el.parentNode) return;
      el.object3D.lookAt(sceneEl.camera.position);
      el.object3D.rotateY(Math.PI);
      requestAnimationFrame(tick);
    };
    tick();
  });

  // === КАЧАНИЕ ВЛЕВО-ВПРАВО ±20° ===
  const swayDur = 3000 + Math.random() * 4000;
  el.setAttribute('animation__sway', {
    property: 'rotation',
    to: '0 20 0',
    dir: 'alternate',
    dur: swayDur,
    easing: 'easeInOutSine',
    loop: true
  });

  el.addEventListener('click', () => {
    if (!gameActive) return;
    scores[type]++;
    updateScales();
    el.remove();
    occupiedPositions = occupiedPositions.filter(p => Math.hypot(p.x - x, p.y - y, p.z - z) > 0.1);
  });

  modelsGroup.appendChild(el);
}

function isTooClose(x, y, z, minDist) {
  for (const pos of occupiedPositions) {
    if (Math.hypot(x - pos.x, y - pos.y, z - pos.z) < minDist) return true;
  }
  return false;
}

function updateScales() {
  document.getElementById('nerv-fill').style.width   = Math.min(scores.nerv * 10, 100) + '%';
  document.getElementById('anx-fill').style.width    = Math.min(scores.anx * 10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
}
