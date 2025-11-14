// script.js — Финальная версия, работает везде

let scores = { red: 0, green: 0, blue: 0 };
let models = [];
let currentTarget = null;

const sceneEl = document.querySelector('a-scene');
const modelsGroup = document.getElementById('models');
const destroyBtn = document.getElementById('destroyBtn');

document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  document.getElementById('progress').style.display = 'flex';
  document.getElementById('crosshair').style.display = 'block';
  destroyBtn.style.display = 'block';
  sceneEl.style.display = 'block';

  if (sceneEl.hasLoaded) initAR();
  else sceneEl.addEventListener('loaded', initAR);
});

function initAR() {
  spawnAllModels();
  requestAnimationFrame(tick);
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
  entity.classList.add('target');

  const size = 0.25 + Math.random() * 0.35;
  entity.setAttribute('scale', `${size} ${size} ${size}`);

  const distance = 2 + Math.random() * 7;
  const angle = (Math.random() * 180 - 90) * Math.PI / 180;
  const x = Math.sin(angle) * distance;
  const z = -Math.cos(angle) * distance;
  const y = 0.5 + Math.random() * 1.8;

  entity.setAttribute('position', { x, y, z });

  modelsGroup.appendChild(entity);
  models.push(entity);
}

function tick() {
  if (!sceneEl.camera) {
    requestAnimationFrame(tick);
    return;
  }

  const camera = sceneEl.camera;
  const center = new THREE.Vector3(0, 0, -1);
  center.applyQuaternion(camera.quaternion);
  center.add(camera.position);

  let closest = null;
  let minAngle = 0.15; // ~8-10 градусов — размер прицела

  models.forEach(model => {
    if (!model.parentNode) return; // уже уничтожена

    const pos = model.getAttribute('position');
    const dir = new THREE.Vector3(pos.x, pos.y, pos.z).sub(camera.position).normalize();
    const angle = dir.angleTo(center.sub(camera.position).normalize());

    if (angle < minAngle) {
      minAngle = angle;
      closest = model;
    }
  });

  if (closest && closest !== currentTarget) {
    if (currentTarget) {
      currentTarget.setAttribute('material', 'emissive', '#000000');
    }
    currentTarget = closest;
    currentTarget.setAttribute('material', 'emissive', '#00ff00');
    currentTarget.setAttribute('emissiveIntensity', '0.8');
    destroyBtn.classList.add('active');
    destroyBtn.textContent = "УНИЧТОЖИТЬ!";
  } else if (!closest && currentTarget) {
    currentTarget.setAttribute('material', 'emissive', '#000000');
    currentTarget = null;
    destroyBtn.classList.remove('active');
    destroyBtn.textContent = "УНИЧТОЖИТЬ ГРАНДАКСИНОМ";
  }

  requestAnimationFrame(tick);
}

destroyBtn.addEventListener('click', () => {
  if (currentTarget) {
    const color = currentTarget.getAttribute('data-color');
    scores[color]++;

    // Анимация исчезновения
    currentTarget.setAttribute('animation', {
      property: 'scale',
      to: '0.01 0.01 0.01',
      dur: 400,
      easing: 'easeInBack'
    });

    setTimeout(() => {
      currentTarget.remove();
      models = models.filter(m => m !== currentTarget);
    }, 450);

    currentTarget = null;
    destroyBtn.classList.remove('active');
    destroyBtn.textContent = "УНИЧТОЖИТЬ ГРАНДАКСИНОМ";

    updateProgressBars();
  }
});

function updateProgressBars() {
  document.getElementById('red-fill').style.width   = Math.min(scores.red   * 10, 100) + '%';
  document.getElementById('green-fill').style.width = Math.min(scores.green * 10, 100) + '%';
  document.getElementById('blue-fill').style.width  = Math.min(scores.blue  * 10, 100) + '%';
}
