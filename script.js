let scores = { nerv: 0, anx: 0, stress: 0 };
let sceneEl, modelsGroup, gameTimer;
let timeLeft = 30;
let gameActive = false;
const hitSound = document.getElementById('hitSound');

// 30 заранее расставленных позиций (без пересечений)
const predefinedPositions = [
  // Нервозность
  {x: -4, y: 2.0, z: -6}, {x: -2, y: 1.5, z: -5}, {x: 0, y: 2.5, z: -7}, {x: 3, y: 1.8, z: -6}, {x: 5, y: 2.2, z: -8},
  {x: -3, y: 3.0, z: -7}, {x: 2, y: 0.8, z: -5}, {x: -1, y: 3.5, z: -9}, {x: 4, y: 2.8, z: -7}, {x: 1, y: 1.2, z: -8},
  // Тревога
  {x: -5, y: 1.0, z: -7}, {x: -3, y: 2.8, z: -5}, {x: 1, y: 3.2, z: -6}, {x: 4, y: 1.5, z: -9}, {x: -1, y: 2.0, z: -8},
  {x: 6, y: 2.5, z: -6}, {x: -4, y: 0.9, z: -5}, {x: 2, y: 3.8, z: -8}, {x: -2, y: 1.8, z: -9}, {x: 3, y: 2.4, z: -5},
  // Стресс
  {x: 0, y: 1.0, z: -6}, {x: -6, y: 2.0, z: -8}, {x: 5, y: 3.0, z: -7}, {x: -2, y: 2.6, z: -6}, {x: 3, y: 0.7, z: -7},
  {x: -5, y: 3.3, z: -6}, {x: 4, y: 1.3, z: -8}, {x: -1, y: 2.9, z: -5}, {x: 2, y: 1.6, z: -9}, {x: 1, y: 3.5, z: -7}
];

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
  spawnFixedModels();
}

function spawnFixedModels() {
  const types = ['nerv', 'anx', 'stress'];
  let index = 0;

  predefinedPositions.forEach(pos => {
    const type = types[Math.floor(index / 10)]; // 0–9: nerv, 10–19: anx, 20–29: stress
    createModel(type, pos.x, pos.y, pos.z);
    index++;
  });
}

function createModel(type, x, y, z) {
  const el = document.createElement('a-entity');
  el.setAttribute('gltf-model', `#${type}`);
  el.setAttribute('data-color', type);
  el.classList.add('clickable');
  el.setAttribute('scale', '0.35 0.35 0.35');
  el.setAttribute('position', `${x} ${y} ${z}`);

  // Всегда смотрит на камеру (без качания!)
  el.addEventListener('model-loaded', () => {
    const tick = () => {
      if (!el.parentNode) return;
      el.object3D.lookAt(sceneEl.camera.position);
      el.object3D.rotateY(Math.PI); // если модель изначально развёрнута спиной
      requestAnimationFrame(tick);
    };
    tick();
  });

  el.addEventListener('click', () => {
    if (!gameActive) return;

    scores[type]++;
    updateScales();

    // Звук
    hitSound.currentTime = 0;
    hitSound.play();

    // Плавное исчезновение
    el.setAttribute('animation', {
      property: 'scale',
      to: '0.01 0.01 0.01',
      dur: 300,
      easing: 'easeInBack'
    });
    setTimeout(() => el.remove(), 350);
  });

  modelsGroup.appendChild(el);
}

function updateScales() {
  document.getElementById('nerv-fill').style.width   = Math.min(scores.nerv * 10, 100) + '%';
  document.getElementById('anx-fill').style.width    = Math.min(scores.anx *10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.stress *10, 100) + '%';
}
