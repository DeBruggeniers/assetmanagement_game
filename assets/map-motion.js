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

  // Coordinates in the original map, before the responsive centre crop.
  const turbines = [
    {x:1324, y:80, tips:[[-9,-42],[-30,30],[37,13]], period:23},
    {x:1439, y:87, tips:[[13,-41],[-35,24],[25,31]], period:26},
    {x:1525, y:83, tips:[[-15,-33],[-21,34],[30,6]], period:21},
  ];

  function restoreBackground(image) {
    // Repair only the baked-in blades. Sample the same row to preserve
    // the horizon and the horizontal bands of fields behind each turbine.
    const patch = document.createElement('canvas');
    patch.width = 300;
    patch.height = 115;
    const g = patch.getContext('2d');
    g.drawImage(image, 1270, 15, 300, 115, 0, 0, 300, 115);
    const original = g.getImageData(0, 0, 300, 115);
    g.clearRect(0, 0, 300, 115);
    g.lineCap = 'round';
    g.lineWidth = 7;
    for (const {x, y, tips} of turbines) {
      for (const [dx, dy] of tips) {
        g.beginPath();
        g.moveTo(x - 1270, y - 15);
        g.lineTo(x - 1270 + dx, y - 15 + dy);
        g.stroke();
      }
    }
    const mask = g.getImageData(0, 0, 300, 115);
    for (let y = 0; y < 115; y++) {
      for (let x = 1; x < 299; x++) {
        const pos = (y * 300 + x) * 4;
        if (!mask.data[pos + 3]) continue;
        let left = pos - 4;
        let right = pos + 4;
        while (mask.data[left + 3]) left -= 4;
        while (mask.data[right + 3]) right += 4;
        const t = (pos - left) / (right - left);
        for (let channel = 0; channel < 3; channel++) {
          mask.data[pos + channel] = original.data[left + channel] * (1 - t)
            + original.data[right + channel] * t;
        }
      }
    }
    g.putImageData(mask, 0, 0);
    return patch;
  }

  function drawTurbines(ctx, patch, seconds) {
    ctx.drawImage(patch, 1270, 15);
    for (const {x, y, tips, period} of turbines) {
      ctx.save();
      ctx.translate(x, y);
      const radius = Math.hypot(...tips[0]);
      const phase = Math.atan2(tips[0][1], tips[0][0]);
      ctx.rotate(phase + seconds * 2 * Math.PI / period);
      for (let blade = 0; blade < 3; blade++) {
        ctx.fillStyle = '#f1f5f5';
        ctx.beginPath();
        ctx.moveTo(0, -1);
        ctx.lineTo(radius * 0.25, -2.4);
        ctx.lineTo(radius, 0);
        ctx.lineTo(radius * 0.20, 1.4);
        ctx.closePath();
        ctx.fill();
        ctx.rotate(2 * Math.PI / 3);
      }
      ctx.fillStyle = '#c4ced0';
      ctx.beginPath();
      ctx.arc(0, 0, 2.4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }

  // Trace the surf below the marina in original image coordinates.
  const shoreline = [[0,417],[30,407],[58,398],[95,383],[125,369],
    [150,357],[168,344],[179,331],[185,320]];

  function drawSurf(ctx, seconds) {
    ctx.save();
    ctx.lineCap = 'round';
    // The lighthouse and its railing stand in front of the breaking waves.
    ctx.beginPath();
    ctx.rect(0, 300, 195, 125);
    ctx.rect(66, 327, 31, 98);
    ctx.clip('evenodd');
    for (let band = 0; band < 3; band++) {
      const cycle = seconds / 9 + band / 3;
      const phase = cycle % 1;
      const fade = Math.sin(Math.PI * phase) ** 2;
      const distance = 18 * (1 - phase) + 2;
      for (let i = 1; i < shoreline.length; i++) {
        const [ax, ay] = shoreline[i - 1];
        const [bx, by] = shoreline[i];
        ctx.beginPath();
        for (let step = 0; step <= 16; step++) {
          const t = step / 16;
          const x = ax + (bx - ax) * t;
          const ripple = Math.sin(x * 0.16 + cycle * 2 * Math.PI);
          const y = ay + (by - ay) * t - distance + ripple * 0.8;
          if (!step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const patchiness = 0.65 + 0.35 * Math.sin(i * 1.9 + cycle * 2 * Math.PI);
        ctx.strokeStyle = 'rgba(241,253,255,' + (0.64 * fade * patchiness) + ')';
        ctx.lineWidth = 0.9 + phase * 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBeacon(ctx, seconds) {
    const angle = seconds * 2 * Math.PI / 12;
    const alpha = Math.max(0, Math.cos(angle)) ** 5;
    if (alpha < 0.01) return;
    ctx.save();
    ctx.translate(81, 348);
    const reach = Math.sin(angle) * 210;
    const gradient = ctx.createLinearGradient(0, 0, reach || 0.01, 12);
    gradient.addColorStop(0, 'rgba(255,248,196,0.86)');
    gradient.addColorStop(1, 'rgba(255,248,196,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(reach, 0);
    ctx.lineTo(reach, 24);
    ctx.lineTo(0, 2);
    ctx.fill();
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
    glow.addColorStop(0, '#fffbd9');
    glow.addColorStop(1, 'rgba(255,238,167,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-9, -9, 18, 18);
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

    let background;
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
        if (image.complete && image.naturalWidth === mapWidth) {
          background ||= restoreBackground(image);
          drawTurbines(ctx, background, time);
          drawSurf(ctx, time);
          drawBeacon(ctx, time);
        }
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
