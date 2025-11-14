// script.js — БОЛЬШАЯ ЗОНА + МОДЕЛИ НЕ СЛИПАЮТСЯ
let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let sceneEl, modelsGroup, startBtn, destroyBtn, topPanel;
let targetEntity = null;
let isLocked = false;

document.addEventListener('DOMContentLoaded', () => {
  startBtn = document.getElementById('startBtn');
  destroyBtn = document.getElementById('destroyBtn');
  topPanel = document.getElementById('topPanel');

  startBtn.addEventListener('click', startAR);
  destroyBtn.addEventListener('click', destroyTarget);
});

function startAR() {
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');

  startBtn.style.display = 'none';
  topPanel.style.display = 'flex';
  destroyBtn.style.display = 'block';
  sceneEl.style.display = 'block';
  existingPositions = [];

  if (sceneEl.hasLoaded) initAR();
  else sceneEl.addEventListener('loaded', initAR);
}

function initAR() {
  const arSystem = sceneEl.components.arjs;
  if (arSystem) arSystem._startSession();

  const hitZone = document.getElementById('hitZone');
  const ring = document.getElementById('crosshair');

  hitZone.addEventListener('raycaster-intersection', (evt) => {
    const hit = evt.detail.els.find(el => el.classList.contains('clickable') && el !== ring);
    if (hit && !isLocked) {
      targetEntity = hit;
      isLocked = true;
      ring.setAttribute('material', 'color', '#027ACA');
    }
  });

  spawnAllModels();
}

function destroyTarget() {
  if (!targetEntity) return;

  const color = targetEntity.getAttribute('data-color');
  if (color === 'red') scores.red++;
  if (color === 'green') scores.green++;
  if (color === 'blue') scores.blue++;

  targetEntity.remove();
  updateScales();

  targetEntity = null;
  isLocked = false;
  document.getElementById('crosshair').setAttribute('material', 'color', 'white');
}

function spawnAllModels() {
  ['red', 'green', 'blue'].forEach(color => {
    for (let i = 0; i < 10; i++) {
      spawnModel(color);
    }
  });
}

function spawnModel(color) {
  let attempts = 0;
  let x, y, z, distance;

  do {
    distance = 3 + Math.random() * 3; // 3–6 метров
    const angle = Math.random() * Math.PI * 2;
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    y = 0.6 + Math.random() * 1.0;
    attempts++;
  } while (isTooClose(x, y, z) && attempts < 100);

  const obj = document.createElement('a-entity');
  obj.setAttribute('gltf-model', `#${color}`);
  obj.setAttribute('data-color', color);
  obj.classList.add('clickable');

  const size = 0.2 + Math.random() * 0.35;
  obj.setAttribute('scale', `${size} ${size} ${size}`);
  obj.setAttribute('position', `${x} ${y} ${z}`);

  modelsGroup.appendChild(obj);
  existingPositions.push({ x, y, z, radius: size * 1.5 });
}

function isTooClose(x, y, z) {
  for (let pos of existingPositions) {
    const dx = x - pos.x;
    const dy = y - pos.y;
    const dz = z - pos.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist < (pos.radius || 0.8) + 0.8) return true;
  }
  return false;
}

function updateScales() {
  document.getElementById('nerv-fill').style.width = Math.min(scores.red * 10, 100) + '%';
  document.getElementById('anxiety-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.blue * 10, 100) + '%';
}
