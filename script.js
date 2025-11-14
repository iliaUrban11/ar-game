// script.js — вся логика игры

let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];

const startBtn = document.getElementById('startBtn');
const ui = document.getElementById('ui');
const progress = document.getElementById('progress');
const sceneEl = document.querySelector('a-scene');
const modelsGroup = document.getElementById('models');

startBtn.addEventListener('click', startAR);

function startAR() {
  startBtn.style.display = 'none';
  ui.style.display = 'block';
  progress.style.display = 'flex';
  sceneEl.style.display = 'block';
  document.getElementById('crosshair').style.display = 'block';  // ← ВКЛЮЧАЕМ ПРИЦЕЛ

  existingPositions = [];

  if (sceneEl.hasLoaded) {
    initAR();
  } else {
    sceneEl.addEventListener('loaded', initAR);
  }
}

function initAR() {
  // Принудительно запускаем AR-сессию (иногда нужно)
  const arSystem = sceneEl.components['arjs'];
  if (arSystem && arSystem._startSession) {
    arSystem._startSession();
  }

  spawnAllModels();
}

function spawnAllModels() {
  const colors = ['red', 'green', 'blue'];
  colors.forEach(color => {
    for (let i = 0; i < 10; i++) { // по 10 моделей каждого цвета
      spawnModel(color);
    }
  });
}

function spawnModel(color) {
  const entity = document.createElement('a-entity');

  entity.setAttribute('gltf-model', `#${color}`);
  entity.setAttribute('data-color', color);
  entity.classList.add('clickable'); // для raycaster

  // Размер модели
  const size = 0.1 + Math.random() * 0.5;
  entity.setAttribute('scale', `${size} ${size} ${size}`);

  // Позиция в пространстве (впереди камеры)
  const distance = 1 + Math.random() * 9;               // от 1 до 10 метров
  const angle = (Math.random() * 180 - 90) * Math.PI / 180; // -90°..+90° по горизонтали
  let x = Math.sin(angle) * distance;
  let z = -Math.cos(angle) * distance;
  let y = 0.2 + Math.random() * 1.8; // высота от 0.2 до 2 метров

  // Проверка пересечения с уже существующими моделями
  let attempts = 0;
  while (hasOverlap(x, y, z) && attempts < 50) {
    x = Math.sin(angle) * distance;
    z = -Math.cos(angle) * distance;
    y = 0.2 + Math.random() * 1.8;
    attempts++;
  }

  entity.setAttribute('position', `${x} ${y} ${z}`);

  // Плавное покачивание вверх-вниз
  entity.setAttribute('animation', {
    property: 'position',
    to: `${x} ${y + 0.4} ${z}`,
    dur: 2000 + Math.random() * 3000,
    dir: 'alternate',
    loop: true,
    easing: 'easeInOutSine'
  });

  // Обработка клика/тапа
  entity.addEventListener('click', () => {
    scores[color]++;
    entity.remove(); // удаляем модель
    updateProgressBars();

    // Можно добавить звук или эффект исчезновения здесь
  });

  modelsGroup.appendChild(entity);
  existingPositions.push({ x, y, z });
}

function hasOverlap(x, y, z) {
  for (const pos of existingPositions) {
    const dist = Math.hypot(x - pos.x, y - pos.y, z - pos.z);
    if (dist < 0.8) return true;
  }
  return false;
}

function updateProgressBars() {
  document.getElementById('red-fill').style.width   = Math.min(scores.red   * 10, 100) + '%';
  document.getElementById('green-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('blue-fill').style.width  = Math.min(scores.blue  * 10, 100) + '%';
}
