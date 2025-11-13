// script.js — FIXED TOUCH ANYWHERE
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

  const canvas = sceneEl.canvas;
  canvas.addEventListener('touchstart', handleTouch, { passive: false });
  canvas.addEventListener('mousedown', handleTouch); // for PC

  spawnAllModels();
}

function handleTouch(event) {
  event.preventDefault();

  const touch = event.touches ? event.touches[0] : event;
  const rect = sceneEl.canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / rect.width;
  const y = (touch.clientY - rect.top) / rect.height;

  const camera = sceneEl.camera;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(x * 2 - 1, -(y * 2 - 1));

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(modelsGroup.object3D.children, true);

  if (intersects.length > 0) {
    let entity = intersects[0].object;
    while (entity && !entity.el) {
      entity = entity.parent;
    }
    if (entity && entity.el && entity.el.hasAttribute('data-color')) {
      const color = entity.el.getAttribute('data-color');
      scores[color]++;
      entity.el.remove();
      updateScales();
    }
  }
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
