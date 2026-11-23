(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const mapWidth = 1672;
  const mapHeight = 941;
  const startTime = performance.now();

  function trace(points) {
    const samples = [{x:points[0][0], y:points[0][1], distance:0}];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[Math.max(0, i - 1)];
      const b = points[i];
      const c = points[i + 1];
      const d = points[Math.min(points.length - 1, i + 2)];
      for (let step = 1; step <= 12; step++) {
        const t = step / 12;
        const interpolate = axis => b[axis] + 0.5 * (
          (c[axis] - a[axis]) * t +
          (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t ** 2 +
          (3 * b[axis] - a[axis] - 3 * c[axis] + d[axis]) * t ** 3
        );
        const x = interpolate(0);
        const y = interpolate(1);
        const last = samples.at(-1);
        samples.push({x, y, distance:last.distance + Math.hypot(x - last.x, y - last.y)});
      }
    }
    return samples;
  }

  const bridge = trace([
    [548, 675], [647, 655], [763, 632], [877, 614], [994, 598], [1092, 588], [1200, 579],
  ]);
  const highway = trace([
    [1166, 153], [1205, 173], [1217, 201], [1237, 231], [1285, 258],
    [1350, 280], [1450, 303], [1550, 331], [1667, 366],
  ]);
  const cyclePath = trace([
    [236, 942], [284, 917], [358, 882], [435, 848], [504, 819], [564, 799],
    [607, 780], [624, 756], [627, 732], [651, 705], [681, 687], [710, 677],
  ]);

  const traffic = [
    {route:bridge, duration:29, interval:46, offset:9, kind:'car', color:'#426d80', size:1},
    {route:highway, duration:31, interval:52, offset:5, kind:'car', color:'#b7965e', size:0.75},
    {route:cyclePath, duration:34, interval:53, offset:2, kind:'cycle', color:'#844035', size:1},
    {route:cyclePath, duration:34, interval:53, offset:11, kind:'cycle', color:'#356677', size:1},
  ];

  function pointOnRoute(route, fraction) {
    const distance = fraction * route.at(-1).distance;
    const index = Math.max(1, route.findIndex(point => point.distance >= distance));
    const before = route[index - 1];
    const after = route[index];
    const mix = (distance - before.distance) / (after.distance - before.distance);
    return {
      x:before.x + (after.x - before.x) * mix,
      y:before.y + (after.y - before.y) * mix,
      angle:Math.atan2(after.y - before.y, after.x - before.x),
    };
  }

  function drawCar(ctx, color) {
    ctx.fillStyle = '#12243445';
    ctx.fillRect(-12, -3, 25, 11);
    ctx.fillStyle = '#26313b';
    ctx.fillRect(-8, -6, 5, 12);
    ctx.fillRect(4, -6, 5, 12);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-12, -5, 24, 10, 3);
    ctx.fill();
    ctx.fillStyle = '#d6e8e7';
    ctx.fillRect(-3, -4, 9, 8);
    ctx.fillStyle = color;
    ctx.fillRect(-1, -3, 5, 6);
    ctx.fillStyle = '#f6eace';
    ctx.fillRect(10, -3, 1.5, 2);
    ctx.fillRect(10, 1, 1.5, 2);
  }

  function drawCyclist(ctx, color) {
    ctx.strokeStyle = '#24313a';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.ellipse(-5, 2, 2.5, 1.45, 0, 0, 2 * Math.PI);
    ctx.ellipse(5, 2, 2.5, 1.45, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 3.2, 2.6, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#f5dec2';
    ctx.beginPath();
    ctx.arc(2.8, -1.2, 1.9, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawTraffic(ctx, seconds) {
    for (const motor of traffic) {
      const elapsed = (seconds + motor.offset) % motor.interval;
      if (elapsed >= motor.duration) continue;
      const fraction = elapsed / motor.duration;
      const {x, y, angle} = pointOnRoute(motor.route, fraction);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(motor.size, motor.size);
      ctx.globalAlpha = Math.min(0.94, fraction * 18, (1 - fraction) * 18);
      if (motor.kind === 'car') drawCar(ctx, motor.color);
      else drawCyclist(ctx, motor.color);
      ctx.restore();
    }
  }

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
        drawTraffic(ctx, time);
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
