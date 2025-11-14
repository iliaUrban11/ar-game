let scores = { nerv: 0, anx: 0, stress: 0 };
let existingPositions = [];
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
playAgainBtn.addEventListener('click', resetGame);

function startGame() {
  startPage.style.display = 'none';
  gameUI.style.display = 'block';
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');
  sceneEl.style.display = 'block';
  
  existingPositions = [];
  scores = { nerv: 0, anx: 0, stress: 0 };
  timeLeft = 30;
  gameActive = true;
  updateScales(); // сброс шкал

  if (sceneEl.hasLoaded) {
    initAR();
  } else {
    sceneEl.addEventListener('loaded', initAR);
  }

  gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  
  if (timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  gameActive = false;
  clearInterval(gameTimer);
  
  // Удаляем все модели
  modelsGroup.innerHTML = '';
  
  // АНИМАЦИЯ ШКАЛ В КОНЦЕ
  setTimeout(() => {
    document.getElementById('nerv-result').textContent = `Нервозность: ${scores.nerv}`;
    document.getElementById('anx-result').textContent = `Тревога: ${scores.anx}`;
    document.getElementById('stress-result').textContent = `Стресс: ${scores.stress}`;
    
    // Заполняем финальные шкалы анимацией
    setTimeout(() => {
      document.getElementById('end-nerv-fill').style.width = Math.min(scores.nerv * 10, 100) + '%';
      document.getElementById('end-anx-fill').style.width = Math.min(scores.anx * 10, 100) + '%';
      document.getElementById('end-stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
    }, 200);
    
    gameUI.style.display = 'none';
    endScreen.style.display = 'flex';
  }, 800);
}

function resetGame() {
  endScreen.style.display = 'none';
  startPage.style.display = 'flex';
  sceneEl.style.display = 'none';
  gameActive = false;
  if (gameTimer) clearInterval(gameTimer);
}

function initAR() {
  const arSystem = sceneEl.components.arjs;
  if (arSystem) arSystem._startSession();
  spawnAllModels();
}

function spawnAllModels() {
  const colors = ['nerv', 'anx', 'stress'];
  colors.forEach(color => {
    for (let i = 0; i < 10; i++) {
      spawnModel(color);
    }
  });
}

function spawnModel(color) {
  if (!gameActive) return;
  
  const obj = document.createElement('a-entity');
  obj.setAttribute('gltf-model', `#${color}`);
  obj.setAttribute('data-color', color);
  obj.classList.add('clickable');

  const size = 0.1 + Math.random() * 0.5;
  obj.setAttribute('scale', `${size} ${size} ${size}`);

  // НОВЫЕ ПОЗИЦИИ: 3-8м, 120° (-60°..+60°)
  const distance = 3 + Math.random() * 5; // 3-8 метров
  const angle = (Math.random() * 120 - 60) * Math.PI / 180; // -60°..+60°
  let x, z, baseY, attempts = 0;

  do {
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    baseY = 0.2 + Math.random() * 1.6;
    attempts++;
  } while (hasOverlap(x, baseY, z) && attempts < 50);

  obj.setAttribute('position', `${x} ${baseY} ${z}`);

  obj.addEventListener('click', () => {
    if (!gameActive) return;
    const colorName = obj.getAttribute('data-color');
    scores[colorName]++;
    updateScales();
    obj.remove();
  });

  modelsGroup.appendChild(obj);
  existingPositions.push({x, y: baseY, z});
}

function hasOverlap(x, y, z) {
  for (let pos of existingPositions) {
    const dist = Math.sqrt((x - pos.x)**2 + (y - pos.y)**2 + (z - pos.z)**2);
    if (dist < 0.8) return true;
  }
  return false;
}

function updateScales() {
  document.getElementById('nerv-fill').style.width = Math.min(scores.nerv * 10, 100) + '%';
  document.getElementById('anx-fill').style.width = Math.min(scores.anx * 10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
}
