// Конфигурация игры
const CONFIG = {
    GAME_TIME: 30,
    SCORE_MULTIPLIER: 10,
    MODEL_SCALE: 0.35,
    ROTATION_SPEED: 0.05,
    FADE_DURATION: 300,
    END_DELAY: 800
};

// Глобальные переменные
let scores = { nerv: 0, anx: 0, stress: 0 };
let sceneEl, modelsGroup, gameTimer, animationFrame;
let timeLeft = CONFIG.GAME_TIME;
let gameActive = false;
let models = [];

// Звук
const hitSound = document.getElementById('hitSound');

// Позиции моделей (30 фиксированных позиций)
const positions = [
    {x:-4,y:2.0,z:-6}, {x:-2,y:1.5,z:-5}, {x:0,y:2.5,z:-7}, {x:3,y:1.8,z:-6}, {x:5,y:2.2,z:-8},
    {x:-3,y:3.0,z:-7}, {x:2,y:0.8,z:-5}, {x:-1,y:3.5,z:-9}, {x:4,y:2.8,z:-7}, {x:1,y:1.2,z:-8},
    {x:-5,y:1.0,z:-7}, {x:-3,y:2.8,z:-5}, {x:1,y:3.2,z:-6}, {x:4,y:1.5,z:-9}, {x:-1,y:2.0,z:-8},
    {x:6,y:2.5,z:-6}, {x:-4,y:0.9,z:-5}, {x:2,y:3.8,z:-8}, {x:-2,y:1.8,z:-9}, {x:3,y:2.4,z:-5},
    {x:0,y:1.0,z:-6}, {x:-6,y:2.0,z:-8}, {x:5,y:3.0,z:-7}, {x:-2,y:2.6,z:-6}, {x:3,y:0.7,z:-7},
    {x:-5,y:3.3,z:-6}, {x:4,y:1.3,z:-8}, {x:-1,y:2.9,z:-5}, {x:2,y:1.6,z:-9}, {x:1,y:3.5,z:-7}
];

// Инициализация элементов интерфейса
const startGameBtn = document.getElementById('startGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

// Обработчики событий
startGameBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', () => location.reload());

// Основные функции игры
function startGame() {
    // Показываем игровой интерфейс
    document.getElementById('startPage').style.display = 'none';
    document.getElementById('gameUI').style.display = 'block';
    
    // Инициализация сцены
    sceneEl = document.querySelector('a-scene');
    modelsGroup = document.getElementById('models');
    sceneEl.style.display = 'block';
    
    // Сброс состояния игры
    scores = { nerv: 0, anx: 0, stress: 0 };
    timeLeft = CONFIG.GAME_TIME;
    gameActive = true;
    models = [];
    
    // Обновление UI
    updateScales();
    document.getElementById('timer').textContent = timeLeft;
    
    // Загрузка сцены или немедленный старт
    if (sceneEl.hasLoaded) {
        initGame();
    } else {
        sceneEl.addEventListener('loaded', initGame);
    }
    
    // Таймер игры
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function initGame() {
    // Очистка предыдущих моделей
    modelsGroup.innerHTML = '';
    
    // Создание всех моделей
    spawnAllModels();
    
    // Запуск анимации поворота
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animateRotation();
}

function spawnAllModels() {
    const types = ['nerv', 'anx', 'stress'];
    
    positions.forEach((position, index) => {
        const type = types[Math.floor(index / 10)]; // Равномерное распределение
        const model = createModel(type, position.x, position.y, position.z);
        models.push(model);
        modelsGroup.appendChild(model);
    });
}

function createModel(type, x, y, z) {
    const element = document.createElement('a-entity');
    
    // Базовые атрибуты
    element.setAttribute('gltf-model', `#${type}`);
    element.setAttribute('data-type', type);
    element.classList.add('clickable');
    element.setAttribute('scale', `${CONFIG.MODEL_SCALE} ${CONFIG.MODEL_SCALE} ${CONFIG.MODEL_SCALE}`);
    element.setAttribute('position', `${x} ${y} ${z}`);
    
    // Оптимизация производительности
    element.object3D.matrixAutoUpdate = false;
    element.object3D.frustumCulled = false;
    
    // Обработка загрузки модели
    element.addEventListener('model-loaded', () => {
        const obj = element.object3D;
        
        // Оптимизация всех мешей модели
        obj.traverse(node => {
            if (node.isMesh) {
                node.frustumCulled = false;
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        // Инициализация матрицы
        obj.updateMatrix();
    });
    
    // Обработка клика по модели
    element.addEventListener('click', () => {
        if (!gameActive || !element.parentNode) return;
        
        // Увеличение счета
        scores[type]++;
        updateScales();
        
        // Воспроизведение звука
        if (hitSound) {
            hitSound.currentTime = 0;
            hitSound.play().catch(e => console.log("Ошибка воспроизведения звука:", e));
        }
        
        // Анимация исчезновения
        element.setAttribute('animation', {
            property: 'scale',
            to: '0.01 0.01 0.01',
            dur: CONFIG.FADE_DURATION,
            easing: 'easeInBack'
        });
        
        // Удаление модели
        setTimeout(() => {
            const index = models.indexOf(element);
            if (index > -1) models.splice(index, 1);
            if (element.parentNode) element.parentNode.removeChild(element);
        }, CONFIG.FADE_DURATION + 50);
    });
    
    return element;
}

function animateRotation() {
    if (!gameActive) return;
    
    const cameraPos = sceneEl.camera.el.object3D.position;
    
    // Плавный поворот всех моделей к камере
    models.forEach(model => {
        if (!model.object3D || !model.object3D.visible) return;
        
        const obj = model.object3D;
        const direction = new THREE.Vector3();
        direction.subVectors(cameraPos, obj.position).normalize();
        
        // Создание матрицы поворота
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.lookAt(obj.position, cameraPos, new THREE.Vector3(0, 1, 0));
        
        // Целевой кватернион
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromRotationMatrix(rotationMatrix);
        
        // Плавная интерполяция
        obj.quaternion.slerp(targetQuaternion, CONFIG.ROTATION_SPEED);
    });
    
    // Рекурсивный вызов для анимации
    animationFrame = requestAnimationFrame(animateRotation);
}

function updateScales() {
    const calculateWidth = (score) => Math.min(score * CONFIG.SCORE_MULTIPLIER, 100) + '%';
    
    document.getElementById('nerv-fill').style.width = calculateWidth(scores.nerv);
    document.getElementById('anx-fill').style.width = calculateWidth(scores.anx);
    document.getElementById('stress-fill').style.width = calculateWidth(scores.stress);
}

function endGame() {
    // Остановка игры
    gameActive = false;
    clearInterval(gameTimer);
    
    // Остановка анимации
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    // Очистка моделей
    models = [];
    modelsGroup.innerHTML = '';
    
    // Задержка перед показом результатов
    setTimeout(() => {
        // Отображение результатов
        document.getElementById('nerv-result').innerHTML = `Нервозность: <b>${scores.nerv}</b>`;
        document.getElementById('anx-result').innerHTML = `Тревога: <b>${scores.anx}</b>`;
        document.getElementById('stress-result').innerHTML = `Стресс: <b>${scores.stress}</b>`;
        
        // Анимация заполнения прогресс-баров
        setTimeout(() => {
            const calculateEndWidth = (score) => Math.min(score * CONFIG.SCORE_MULTIPLIER, 100) + '%';
            
            document.getElementById('end-nerv-fill').style.width = calculateEndWidth(scores.nerv);
            document.getElementById('end-anx-fill').style.width = calculateEndWidth(scores.anx);
            document.getElementById('end-stress-fill').style.width = calculateEndWidth(scores.stress);
        }, 300);
        
        // Переключение экранов
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('endScreen').style.display = 'flex';
    }, CONFIG.END_DELAY);
}

// Автоматическая инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    console.log('Игра "Грандаксин против" загружена и готова к запуску!');
});
