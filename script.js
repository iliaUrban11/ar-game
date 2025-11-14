// script.js — 100% рабочий код (протестирован!)
let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let sceneEl, modelsGroup, startBtn;

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
  updateScales();

  if (sceneEl.hasLoaded) {
    initAR();
  } else {
    sceneEl.addEventListener('loaded', initAR);
  }
}

function initAR() {
  const arSystem = sceneEl.components.arjs;
  if (arSystem) arSystem._startSession();

  spawnAllModels();
}

function spawnAllModels() {
  const colors = ['red', 'green', 'blue'];
  colors.forEach(color => {
    for (let i = 0; i < 10; i++) {
      spawnModel(color);
    }
  });
}

function spawnModel(color) {
  const obj = document.createElement('a-entity');
  obj.setAttribute('gltf-model', `#${color}`);
  obj.setAttribute('data-color', color);
  obj.classList.add('clickable');

  const size = 0.15 + Math.random() * 0.45;
  obj.setAttribute('scale', `${size} ${size} ${size}`);

  let x, z, y, attempts = 0;
  do {
    const distance = 1 + Math.random() * 9;
    const angle = (Math.random() * 180 - 90) * Math.PI / 180;
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    y = 0.3 + Math.random() * 1.5;
    attempts++;
  } while (hasOverlap(x, y, z) && attempts < 100);

  obj.setAttribute('position', `${x} ${y} ${z}`);

  // Плавное покачивание вверх-вниз
  obj.setAttribute('animation', `
    property: position;
    to: ${x} ${y + 0.4} ${z};
    dur: ${2500 + Math.random() * 2500};
    dir: alternate;
    loop: true;
    easing: easeInOutSine
  `);

  // КЛИК — исчезает модель
  obj.addEventListener('click', () => {
    scores[color]++;
    obj.remove();
    updateScales();
  });

  modelsGroup.appendChild(obj);
  existingPositions.push({ x, y, z });
}

function hasOverlap(x, y, z) {
  for (let pos of existingPositions) {
    const dist = Math.hypot(x - pos.x, y - pos.y, z - pos.z);
    if (dist < 0.9) return true;
  }
  return false;
}

function updateScales() {
  document.getElementById('red-fill').style.width   = Math.min(scores.red * 10, 100) + '%';
  document.getElementById('green-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('blue-fill').style.width  = Math.min(scores.blue * 10, 100) + '%';
}
