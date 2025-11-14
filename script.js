// script.js — Рабочая версия с Грандаксином

let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let currentTarget = null;

const startBtn = document.getElementById('startBtn');
const ui = document.getElementById('ui');
const progress = document.getElementById('progress');
const crosshair = document.getElementById('crosshair');
const destroyBtn = document.getElementById('destroyBtn');
const sceneEl = document.querySelector('a-scene');
const modelsGroup = document.getElementById('models');
const camera = document.querySelector('a-entity[camera]');

startBtn.addEventListener('click', startAR);
destroyBtn.addEventListener('click', destroyTarget);

function startAR() {
  startBtn.style.display = 'none';
  ui.style.display = 'block';
  progress.style.display = 'flex';
  crosshair.style.display = 'block';
  destroyBtn.style.display = 'block';
  sceneEl.style.display = 'block';

  existingPositions = [];

  if (sceneEl.hasLoaded) {
    initAR();
  } else {
    sceneEl.addEventListener('loaded', initAR);
  }
}

function initAR() {
  spawnAllModels();
  tick(); // запускаем постоянную проверку прицела
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
  const entity = document.createElement('a-entity');
  entity.setAttribute('gltf-model', `#${color}`);
  entity.setAttribute('data-color', color);
  entity.classList.add('clickable');

  const size = 0.2 + Math.random() * 0.4;
  entity.setAttribute('scale', `${size} ${size} ${size}`);

  const distance = 2 + Math.random() * 8;
  const angle = (Math.random() * 180 - 90) * Math.PI / 180;
  let x = Math.sin(angle) * distance;
  let z = -Math.cos(angle) * distance;
  let y = 0.5 + Math.random() * 1.5;

  let attempts = 0;
  while (hasOverlap(x, y, z) && attempts < 50) {
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    y = 0.5 + Math.random() * 1.5;
    attempts++;
  }

  entity.setAttribute('position', `${x} ${y} ${z}`);
  // УБРАНО ПОКАЧИВАНИЕ!

  modelsGroup.appendChild(entity);
  existingPositions.push({ x, y, z });
}

function hasOverlap(x, y, z) {
  for (const pos of existingPositions) {
    if (Math.hypot(x - pos.x, y - pos.y, z - pos.z) < 1) return true;
  }
  return false;
}

// Главная функция — проверяет, что в центре прицела
function tick() {
  if (!camera || !camera.components.raycaster) {
    requestAnimationFrame(tick);
    return;
  }

  const intersects = camera.components.raycaster.getIntersection(modelsGroup);
  
  if (intersects && intersects.object.el.classList.contains('clickable')) {
    const target = intersects.object.el;

    if (currentTarget !== target) {
      if (currentTarget) currentTarget.setObject3D('mesh', currentTarget.getObject3D('mesh'));
      currentTarget = target;

      // Подсвечиваем модель
      const mesh = currentTarget.getObject3D('mesh');
      if (mesh) mesh.traverse(node => { if (node.isMesh) node.emissive = new THREE.Color(0x00ff00); });

      destroyBtn.classList.add('active');
      destroyBtn.textContent = "УНИЧТОЖИТЬ!";
    }
  } else {
    if (currentTarget) {
      const mesh = currentTarget.getObject3D('mesh');
      if (mesh) mesh.traverse(node => { if (node.isMesh) node.emissive = new THREE.Color(0x000000); });
      currentTarget = null;
    }
    destroyBtn.classList.remove('active');
    destroyBtn.textContent = "УНИЧТОЖИТЬ ГРАНДАКСИНОМ";
  }

  requestAnimationFrame(tick);
}

function destroyTarget() {
  if (currentTarget) {
    const color = currentTarget.getAttribute('data-color');
    scores[color]++;
    updateProgressBars();

    // Эффект исчезновения
    currentTarget.setAttribute('animation', {
      property: 'scale',
      to: '0.01 0.01 0.01',
      dur: 400,
      easing: 'easeInBack'
    });

    setTimeout(() => currentTarget.remove(), 450);

    currentTarget = null;
    destroyBtn.classList.remove('active');
    destroyBtn.textContent = "УНИЧТОЖИТЬ ГРАНДАКСИНОМ";
  }
}

function updateProgressBars() {
  document.getElementById('red-fill').style.width   = Math.min(scores.red   * 10, 100) + '%';
  document.getElementById('green-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('blue-fill').style.width  = Math.min(scores.blue  * 10, 100) + '%';
}
