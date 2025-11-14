// script.js — ФИНАЛЬНАЯ ВЕРСИЯ: ПЛАВНАЯ МИШЕНЬ + СИНИЙ КНОПКА
let scores = { red: 0, green: 0, blue: 0 };
let existingPositions = [];
let sceneEl, modelsGroup, startBtn, destroyBtn, bottomPanel;
let targetEntity = null;
let isAiming = false;

document.addEventListener('DOMContentLoaded', () => {
  startBtn = document.getElementById('startBtn');
  destroyBtn = document.getElementById('destroyBtn');
  bottomPanel = document.getElementById('bottomPanel');
  
  startBtn.addEventListener('click', startAR);
  destroyBtn.addEventListener('click', destroyTarget);
});

function startAR() {
  const ui = document.getElementById('ui');
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');

  startBtn.style.display = 'none';
  ui.style.display = 'block';
  bottomPanel.style.display = 'flex';
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

  const ring = document.getElementById('targetRing');

  // НАВЕДЁН НА МОДЕЛЬ → ПЛАВНО СИНИЙ
  ring.addEventListener('raycaster-intersection', (evt) => {
    const hit = evt.detail.els[0];
    if (hit && hit.classList.contains('clickable')) {
      targetEntity = hit;
      if (!isAiming) {
        isAiming = true;
        ring.setAttribute('animation__color', {
          property: 'material.color',
          to: '#027ACA',
          dur: 300,
          easing: 'easeOutQuad'
        });
        ring.setAttribute('animation__emissive', {
          property: 'material.emissive',
          to: '#027ACA',
          dur: 300,
          easing: 'easeOutQuad'
        });
      }
    }
  });

  // УШЁЛ С МОДЕЛИ → ПЛАВНО БЕЛЫЙ
  ring.addEventListener('raycaster-intersection-cleared', () => {
    targetEntity = null;
    if (isAiming) {
      isAiming = false;
      ring.setAttribute('animation__color', {
        property: 'material.color',
        to: 'white',
        dur: 400,
        easing: 'easeOutQuad'
      });
      ring.setAttribute('animation__emissive', {
        property: 'material.emissive',
        to: 'white',
        dur: 400,
        easing: 'easeOutQuad'
      });
    }
  });

  spawnAllModels();
}

function destroyTarget() {
  if (!targetEntity) return;

  const color = targetEntity.getAttribute('data-color');
  scores[color]++;
  targetEntity.remove();
  updateScales();
  targetEntity = null;
}

function spawnAllModels() {
  ['red', 'green', 'blue'].forEach(color => {
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
  obj.setAttribute('animation', `
    property: position;
    to: ${x} ${baseY + 0.4} ${z};
    dur: ${2000 + Math.random() * 3000};
    dir: alternate;
    loop: true;
    easing: easeInOutSine
  `);

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
