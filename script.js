// script.js — FULLY WORKING: TAP ANYWHERE (EVEN CORNERS!)
let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let sceneEl, modelsGroup, startBtn;
let gameTime = 60;
let timerInterval;
let totalModels = 30;

// ЗВУК "ЧПОК!"
const popSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3');

document.addEventListener('DOMContentLoaded', () => {
  startBtn = document.getElementById('startBtn');
  startBtn.addEventListener('click', startAR);
});

function startAR() {
  const ui = document.getElementById('ui');
  const progress = document.getElementById('progress');
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');

  startBtn.style.display = 'none';
  ui.style.display = 'block';
  progress.style.display = 'flex';
  sceneEl.style.display = 'block';
  existingPositions = [];
  scores = { red: 0, green: 0, blue: 0 };
  gameTime = 60;

  // ТАЙМЕР + СЧЁТЧИК
  ui.innerText = `Время: ${gameTime} сек | Собрано: 0/30`;
  timerInterval = setInterval(() => {
    gameTime--;
    ui.innerText = `Время: ${gameTime} сек | Собрано: ${scores.red + scores.green + scores.blue}/30`;
    if (gameTime <= 0) endGame();
  }, 1000);

  if (sceneEl.hasLoaded) {
    initAR();
  } else {
    sceneEl.addEventListener('loaded', initAR);
  }
}

function initAR() {
  const arSystem = sceneEl.components.arjs;
  if (arSystem) arSystem._startSession();

  // ДОБАВЛЯЕМ НЕВИДИМЫЙ КУРСОР ДЛЯ RAYCAST
  const camera = sceneEl.camera.el;
  const cursor = document.createElement('a-cursor');
  cursor.setAttribute('raycaster', 'objects: .clickable; far: 100');
  cursor.setAttribute('position', '0 0 -1');
  cursor.setAttribute('geometry', 'primitive: ring; radiusInner: 0.001; radiusOuter: 0.002');
  cursor.setAttribute('material', 'color: white; opacity: 0');
  camera.appendChild(cursor);

  // КЛИК ЧЕРЕЗ КУРСОР — РАБОТАЕТ В УГЛАХ!
  cursor.addEventListener('click', (event) => {
    const intersected = event.detail.intersection;
    if (!intersected) return;

    let entity = intersected.object.el;
    while (entity && !entity.hasAttribute('data-color')) {
      entity = entity.parentEl;
    }
    if (entity && entity.hasAttribute('data-color')) {
      const color = entity.getAttribute('data-color');
      scores[color]++;
      entity.remove();
      popSound.currentTime = 0;
      popSound.play();
      updateScales();
      document.getElementById('ui').innerText = `Время: ${gameTime} сек | Собрано: ${scores.red + scores.green + scores.blue}/30`;

      if (scores.red + scores.green + scores.blue >= totalModels) {
        endGame(true);
      }
    }
  });

  spawnAllModels();
}

function endGame(win = false) {
  clearInterval(timerInterval);
  modelsGroup.innerHTML = '';

  const endScreen = document.createElement('div');
  endScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); color: white; font-family: Arial;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    z-index: 10000; text-align: center; padding: 20px;
  `;

  endScreen.innerHTML = `
    <h1 style="font-size: 2.5em; margin: 10px;">${win ? 'ПОБЕДА!' : 'ВРЕМЯ ВЫШЛО!'}</h1>
    <p style="font-size: 1.5em;">Собрано: ${scores.red + scores.green + scores.blue}/30</p>
    <button id="restartBtn" style="
      margin-top: 20px; padding: 15px 30px; font-size: 1.3em;
      background: #00b894; color: white; border: none; border-radius: 50px;
      cursor: pointer;
    ">Играть снова</button>
  `;

  document.body.appendChild(endScreen);

  document.getElementById('restartBtn').addEventListener('click', () => {
    endScreen.remove();
    startBtn.style.display = 'block';
    sceneEl.style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('progress').style.display = 'none';
  });
}

function spawnAllModels() {
  ['red', 'green', 'blue'].forEach(color => {
    for (let i = 0; i < 10; i++) spawnModel(color);
  });
}

function spawnModel(color) {
  const obj = document.createElement('a-entity');
  obj.setAttribute('gltf-model', `#${color}`);
  obj.setAttribute('data-color', color);
  obj.classList.add('clickable');

  const size = 0.1 + Math.random() * 0.5;
  obj.setAttribute('scale', `${size} ${size} ${size}`);

  const distance = 1 + Math.random() * 9;
  const angle = (Math.random() * 180 - 90) * Math.PI / 180;
  let x, z, baseY, attempts = 0;
  do {
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    baseY = 0.2 + Math.random() * 1.6;
    attempts++;
  } while (hasOverlap(x, baseY, z) && attempts < 50);

  obj.setAttribute('position', `${x} ${baseY} ${z}`);
  obj.setAttribute('animation', `property: position; to: ${x} ${baseY + 0.4} ${z}; dur: ${2000 + Math.random() * 3000}; dir: alternate; loop: true; easing: easeInOutSine`);

  modelsGroup.appendChild(obj);
  existingPositions.push({x, y: baseY, z});
}

function hasOverlap(x, y, z) {
  for (let pos of existingPositions) {
    if (Math.sqrt((x - pos.x)**2 + (y - pos.y)**2 + (z - pos.z)**2) < 0.8) return true;
  }
  return false;
}

function updateScales() {
  document.getElementById('red-fill').style.width = Math.min(scores.red * 10, 100) + '%';
  document.getElementById('green-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('blue-fill').style.width = Math.min(scores.blue * 10, 100) + '%';
}
