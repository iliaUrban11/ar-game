let scores = { nerv: 0, anx: 0, stress: 0 };
let sceneEl, modelsGroup, gameTimer;
let timeLeft = 30;
let gameActive = false;
const hitSound = document.getElementById('hitSound');

// 30 фиксированных позиций
const positions = [
  {x:-4,y:2.0,z:-6},{x:-2,y:1.5,z:-5},{x:0,y:2.5,z:-7},{x:3,y:1.8,z:-6},{x:5,y:2.2,z:-8},
  {x:-3,y:3.0,z:-7},{x:2,y:0.8,z:-5},{x:-1,y:3.5,z:-9},{x:4,y:2.8,z:-7},{x:1,y:1.2,z:-8},
  {x:-5,y:1.0,z:-7},{x:-3,y:2.8,z:-5},{x:1,y:3.2,z:-6},{x:4,y:1.5,z:-9},{x:-1,y:2.0,z:-8},
  {x:6,y:2.5,z:-6},{x:-4,y:0.9,z:-5},{x:2,y:3.8,z:-8},{x:-2,y:1.8,z:-9},{x:3,y:2.4,z:-5},
  {x:0,y:1.0,z:-6},{x:-6,y:2.0,z:-8},{x:5,y:3.0,z:-7},{x:-2,y:2.6,z:-6},{x:3,y:0.7,z:-7},
  {x:-5,y:3.3,z:-6},{x:4,y:1.3,z:-8},{x:-1,y:2.9,z:-5},{x:2,y:1.6,z:-9},{x:1,y:3.5,z:-7}
];

document.getElementById('startGameBtn').onclick = startGame;
document.getElementById('playAgainBtn').onclick = () => location.reload();

function startGame() {
  document.getElementById('startPage').style.display = 'none';
  document.getElementById('gameUI').style.display = 'block';
  sceneEl = document.querySelector('a-scene');
  modelsGroup = document.getElementById('models');
  sceneEl.style.display = 'block';

  scores = { nerv: 0, anx: 0, stress: 0 };
  timeLeft = 30;
  gameActive = true;
  updateScales();

  if (sceneEl.hasLoaded) initAR();
  else sceneEl.addEventListener('loaded', initAR);

  gameTimer = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(gameTimer);
  modelsGroup.innerHTML = '';

  setTimeout(() => {
    document.getElementById('nerv-result').innerHTML   = `Нервозность: <b>${scores.nerv}</b>`;
    document.getElementById('anx-result').innerHTML    = `Тревога: <b>${scores.anx}</b>`;
    document.getElementById('stress-result').innerHTML = `Стресс: <b>${scores.stress}</b>`;

    setTimeout(() => {
      document.getElementById('end-nerv-fill').style.width   = Math.min(scores.nerv * 10, 100) + '%';
      document.getElementById('end-anx-fill').style.width    = Math.min(scores.anx * 10, 100) + '%';
      document.getElementById('end-stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
    }, 300);

    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('endScreen').style.display = 'flex';
  }, 800);
}

function initAR() {
  spawnAll();
}

function spawnAll() {
  const types = ['nerv', 'anx', 'stress'];
  let i = 0;
  positions.forEach(p => {
    const type = types[Math.floor(i / 10)];
    makeModel(type, p.x, p.y, p.z);
    i++;
  });
}

function makeModel(type, x, y, z) {
  const el = document.createElement('a-entity');
  el.setAttribute('gltf-model', `#${type}`);
  el.setAttribute('data-color', type);
  el.classList.add('clickable');
  el.setAttribute('scale', '0.35 0.35 0.35');
  el.setAttribute('position', `${x} ${y} ${z}`);

  // САМАЯ СТАБИЛЬНАЯ СИСТЕМА ПОВОРОТА — НИКАКОЙ ТРЯСКИ
  el.addEventListener('model-loaded', () => {
    const obj = el.object3D;
    // Отключаем лишние пересчёты
    obj.traverse(n => { if (n.isMesh) n.frustumCulled = false; });

    // Поворачиваем только когда камера двигается
    const update = () => {
      obj.lookAt(sceneEl.camera.position);
      obj.rotateY(Math.PI); // если модель спиной
    };
    sceneEl.camera.el.addEventListener('componentchanged', e => {
      if (e.detail.name === 'position' || e.detail.name === 'rotation') update();
    });
    update(); // сразу
  });

  el.addEventListener('click', () => {
    if (!gameActive) return;
    scores[type]++;
    updateScales();
    hitSound.currentTime = 0;
    hitSound.play();
    el.setAttribute('animation', {property:'scale', to:'0.01 0.01 0.01', dur:300, easing:'easeInBack'});
    setTimeout(() => el.remove(), 350);
  });

  modelsGroup.appendChild(el);
}

function updateScales() {
  document.getElementById('nerv-fill').style.width   = Math.min(scores.nerv * 10, 100) + '%';
  document.getElementById('anx-fill').style.width    = Math.min(scores.anx * 10, 100) + '%';
  document.getElementById('stress-fill').style.width = Math.min(scores.stress * 10, 100) + '%';
}
