// script.js — Большая зона поражения + плавная смена цвета
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
  const crosshair = document.getElementById('crosshair');

  hitZone.addEventListener('raycaster-intersection', (evt) => {
    const hit = evt.detail.els.find(el => el.classList.contains('clickable') && el !== crosshair);
    if (hit && !isLocked) {
      targetEntity = hit;
      isLocked = true;
      crosshair.setAttribute('material', 'color', '#027ACA');
      crosshair.emit('locked');
    }
  });

  // Цвет НЕ возвращается назад — остаётся синим до выстрела
  // Убираем intersection-cleared

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

  // Сброс мишени после выстрела
  targetEntity = null;
  isLocked = false;
  document.getElementById('crosshair').setAttribute('material', 'color', 'white');
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

  const size = 0.2 + Math.random() * 0.4;
  obj.setAttribute('scale', `${size} ${size} ${size}`);

  const distance = 3 + Math.random() * 3; // 3–6 метров
  const angle = (Math.random() * 180 - 90) * Math.PI / 180;
  const x = Math.sin(angle) * distance;
  const z = -Math.cos(angle) * distance;
  const y = 0.6 + Math.random() * 1.0;

  obj.setAttribute('position', `${x} ${y} ${z}`);

  modelsGroup.appendChild(obj);
  existingPositions.push({x, y, z});
}

function updateScales() {
  document.getElementById('nerv-fill').style.width = Math.min(scores.red * 10, 100) + '%';
  document.getElementById('anxiety-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.blue * 10, 100) + '%';
}
