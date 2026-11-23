(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const mapWidth = 1672;
  const mapHeight = 941;
  const startTime = performance.now();

  function drawBirds(ctx, seconds) {
    const time = (seconds + 47) % 67;
    if (time > 19) return;
    const progress = time / 19;
    ctx.save();
    ctx.globalAlpha = Math.min(0.72, progress * 6, (1 - progress) * 6);
    ctx.strokeStyle = '#243b50';
    ctx.lineWidth = 1.9;
    ctx.lineCap = 'round';
    for (const [index, offset] of [[0, 0], [1, 24], [2, 47]]) {
      const x = 310 + 1050 * progress - offset;
      const y = 54 - 15 * Math.sin(progress * Math.PI) + (index % 2 ? -7 : index * 5);
      const flap = 1.8 * Math.sin(time * 7 + index);
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 2 - flap);
      ctx.quadraticCurveTo(x - 2.8, y - 3, x, y + 1);
      ctx.quadraticCurveTo(x + 2.8, y - 3, x + 6, y - 2 - flap);
      ctx.stroke();
    }
    ctx.restore();
  }

  let currentMap;
  let dispose = () => {};

  function addMotion(map) {
    const image = map.querySelector(':scope > img');
    if (!image) return () => {};
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    Object.assign(canvas.style, {
      position:'absolute',
      inset:'0',
      width:'100%',
      height:'100%',
      pointerEvents:'none',
    });
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'map-motion';
    image.after(canvas);

    let frame = 0;
    let inView = false;
    let lastFrame = -Infinity;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    function paint(timestamp) {
      frame = 0;
      if (!inView || document.hidden || motionPreference.matches) return;
      if (timestamp - lastFrame >= 1000 / 30) {
        lastFrame = timestamp;
        const time = (timestamp - startTime) / 1000;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
        drawBirds(ctx, time);
      }
      frame = requestAnimationFrame(paint);
    }

    function update() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (motionPreference.matches) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (inView && !document.hidden && !motionPreference.matches) frame = requestAnimationFrame(paint);
    }

    function resize() {
      const {width, height} = image.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      // Match the centre crop of the map's object-fit: cover image.
      scale = Math.max(width / mapWidth, height / mapHeight) * pixelRatio;
      offsetX = (canvas.width - mapWidth * scale) / 2;
      offsetY = (canvas.height - mapHeight * scale) / 2;
    }

    const sizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    sizeObserver.observe(image);
    visibilityObserver.observe(map);
    document.addEventListener('visibilitychange', update);
    motionPreference.addEventListener('change', update);
    resize();

    return () => {
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', update);
      motionPreference.removeEventListener('change', update);
      if (frame) cancelAnimationFrame(frame);
    };
  }

  function sync() {
    const map = app.querySelector('.world-image');
    if (map === currentMap) return;
    dispose();
    currentMap = map;
    dispose = map ? addMotion(map) : () => {};
  }

  new MutationObserver(sync).observe(app, {childList:true});
  sync();
})();
