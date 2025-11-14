
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

  // КАЧАНИЕ УДАЛЕНО — модели стоят неподвижно

  obj.addEventListener('click', () => {
    scores[color]++;
    obj.remove();
    updateScales();
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
  document.getElementById('red-fill').style.width = Math.min(scores.red * 10, 100) + '%';
  document.getElementById('green-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('blue-fill').style.width = Math.min(scores.blue * 10, 100) + '%';
}
