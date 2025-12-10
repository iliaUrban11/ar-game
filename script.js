function createModel(type, x, y, z) {
  const el = document.createElement('a-entity');
  el.setAttribute('gltf-model', `#${type}`);
  el.setAttribute('data-color', type);
  el.classList.add('clickable');
  el.setAttribute('scale', '0.35 0.35 0.35');
  el.setAttribute('position', `${x} ${y} ${z}`);

  // СУПЕР-СТАБИЛЬНЫЙ BILLBOARD БЕЗ ДЁРГАНИЙ
  el.addEventListener('model-loaded', () => {
    const obj = el.object3D;
    obj.traverse(node => { if (node.isMesh) node.frustumCulled = false; });

    const updateLook = () => {
      obj.lookAt(sceneEl.camera.position);
      obj.rotateY(Math.PI);
    };

    // Обновляем только когда камера двигается
    sceneEl.camera.el.addEventListener('componentchanged', (evt) => {
      if (evt.detail.name === 'position' || evt.detail.name === 'rotation') {
        updateLook();
      }
    });

    updateLook(); // первый раз сразу
  });

  el.addEventListener('click', () => {
    if (!gameActive) return;
    scores[type]++;
    updateScales();
    hitSound.currentTime = 0;
    hitSound.play();

    el.setAttribute('animation', {
      property: 'scale',
      to: '0.01 0.01 0.01',
      dur: 300,
      easing: 'easeInBack'
    });
    setTimeout(() => el.remove(), 350);
  });

  modelsGroup.appendChild(el);
}
