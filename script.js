// script.js — Грандаксин-версия

let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let currentTarget = null; // текущая цель под прицелом

const startBtn = document.getElementById('startBtn');
const ui = document.getElementById('ui');
const progress = document.getElementById('progress');
const crosshair = document.getElementById('crosshair');
const destroyBtn = document.getElementById('destroyBtn');
const sceneEl = document.querySelector('a-scene');
const modelsGroup = document.getElementById('models');

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

  // Отслеживаем, какая модель сейчас под прицелом
  setInterval(checkTargetUnderCrosshair, 100);
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

  const size = 0.15 + Math.random() * 0.4;
  entity.setAttribute('scale', `${size} ${size} ${size}`);

  const distance = 1.5 + Math.random() * 8;
  const angle = (Math.random() * 180 - 90) * Math.PI / 180;
  let x = Math.sin(angle) * distance;
  let z = -Math.cos(angle) * distance;
  let y = 0.3 + Math.random() * 1.7;

  let attempts = 0;
  while (hasOverlap(x, y, z) && attempts < 50) {
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    y = 0.3 + Math.random() * 1.7;
    attempts++;
  }

  entity.setAttribute('position', `${x} ${y} ${z}`);
  entity.setAttribute('animation', {
    property: 'position',
    to: `${x} ${y + 0.5} ${z}`,
    dur: 2500 + Math.random() * 3000,
    dir: 'alternate',
    loop: true,
    easing: 'easeInOutSine'
  });

  // Подсветка при наведении
  entity.addEventListener('mouseenter', () => {
    if (!currentTarget) {
      entity.setAttribute('material', 'emissive', '#ff0000');
      entity.setAttribute('emissiveIntensity', '0.7');
    }
  });
  entity.addEventListener('mouseleave', () => {
    if (currentTarget !== entity) {
      entity.removeAttribute('material');
    }
  });

  modelsGroup.appendChild(entity);
  existingPositions.push({ x, y, z });
}

function hasOverlap(x, y, z) {
  for (const pos of existingPositions) {
    if (Math.hypot(x - pos.x, y - pos.y, z - pos.z) < 0.9) return true;
  }
  return false;
}

function checkTargetUnderCrosshair() {
  const raycaster = sceneEl.querySelector('a-camera').components.raycaster;
  const intersects = raycaster.intersectObjects(modelsGroup.object3D.children, true);

  if (intersects.length > 0) {
    const target = intersects[0].object.el;
    if (target.classList.contains('clickable')) {
      if (currentTarget !== target) {
        // Сброс предыдущей подсветки
        if (currentTarget) {
          currentTarget.removeAttribute('material');
        }
        currentTarget = target;
        currentTarget.setAttribute('material', 'emissive', '#00ff00');
        currentTarget.setAttribute('emissiveIntensity', '0.9');
        destroyBtn.classList.add('active');
        destroyBtn.textContent = "УНИЧТОЖИТЬ!";
      }
      return;
    }
  }

  // Нет цели
  if (currentTarget) {
    currentTarget.removeAttribute('material');
    currentTarget = null;
  }
  destroyBtn.classList.remove('active');
  destroyBtn.textContent = "УНИЧТОЖИТЬ ГРАНДАКСИНОМ";
}

function destroyTarget() {
  if (currentTarget) {
    const color = currentTarget.getAttribute('data-color');
    scores[color]++;
    updateProgressBars();

    // Эффект исчезновения
    currentTarget.setAttribute('animation__scale', {
      property: 'scale',
      to: '0.01 0.01 0.01',
      dur: 300,
      easing: 'easeInBack'
    });
    currentTarget.setAttribute('animation__fade', {
      property: 'material.opacity',
      to: '0',
      dur: 300
    });

    setTimeout(() => currentTarget.remove(), 350);

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
