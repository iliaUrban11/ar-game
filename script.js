// script.js — кнопка "УНИЧТОЖИТЬ" + твой SVG-прицел
let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let sceneEl, modelsGroup;
let currentTarget = null;
let isLocked = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startBtn').onclick = startAR;
  document.getElementById('destroyBtn').onclick = destroyTarget;
});

function startAR() {
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');

  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('topPanel').style.display = 'flex';
  document.getElementById('destroyBtn').style.display = 'block';
  sceneEl.style.display = 'block';

  scores = { red: 0, green: 0, blue: 0 };
  existingPositions = [];
  updateScales();

  if (sceneEl.hasLoaded) initAR();
  else sceneEl.addEventListener('loaded', initAR);
}

function initAR() {
  const arSystem = sceneEl.components.arjs;
  if (arSystem) arSystem._startSession();

  const hitZone = document.getElementById('hitZone');
  const crosshair = document.getElementById('crosshair');

  hitZone.addEventListener('raycaster-intersection', (e) => {
    const hit = e.detail.els.find(el => el.classList.contains('clickable') && el !== hitZone);
    if (hit && !isLocked) {
      currentTarget = hit;
      isLocked = true;
      crosshair.setAttribute('material', 'color', '#027ACA');
    }
  });

  spawnAllModels();
}

function destroyTarget() {
  if (!currentTarget) return;

  const color = currentTarget.getAttribute('data-color');
  scores[color]++;
  currentTarget.remove();
  updateScales();

  currentTarget = null;
  isLocked = false;
  document.getElementById('crosshair').setAttribute('material', 'color', 'white');
}

function spawnAllModels() {
  ['red', 'green', 'blue'].forEach(color => {
 trit    for (let i = 0; i < 10; i++) spawnModel(color);
  });
}

function spawnModel(color) {
  let x, y, z, attempts = 0;
  do {
    const dist = 3 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    x = Math.sin(angle) * dist;
    z = -Math.cos(angle) * dist;
    y = 0.7 + Math.random() * 0.9;
    attempts++;
  } while (isTooClose(x, y, z) && attempts < 100);

  const obj = document.createElement('a-entity');
  obj.setAttribute('gltf-model', `#${color}`);
  obj.setAttribute('data-color', color);
  obj.classList.add('clickable');

  const size = 0.25 + Math.random() * 0.35;
  obj.setAttribute('scale', `${size} ${size} ${size}`);
  obj.setAttribute('position', `${x} ${y} ${z}`);

  modelsGroup.appendChild(obj);
  existingPositions.push({ x, y, z });
}

function isTooClose(x, y, z) {
  return existingPositions.some(pos => {
    const dx = x - pos.x;
    const dy = y - pos.y;
    const dz = z - pos.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz) < 1.3;
  });
}

function updateScales() {
  document.getElementById('nerv-fill').style.width = (scores.red * 10) + '%';
  document.getElementById('anxiety-fill').style.width = (scores.green * 10) + '%';
  document.getElementById('stress-fill').style.width = (scores.blue * 10) + '%';
}
