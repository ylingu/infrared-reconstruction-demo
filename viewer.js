const defaultCamera = { yaw: -0.26, pitch: 0.34, distance: 27 };

function readCloudFrame(encodedFrame) {
  const binary = atob(encodedFrame);
  const frame = new Int16Array(binary.length / 2);
  for (let offset = 0; offset < binary.length; offset += 2) {
    frame[offset / 2] = binary.charCodeAt(offset) | (binary.charCodeAt(offset + 1) << 8);
  }
  return frame;
}

function pointColor(color) {
  const intensity = (color % 256) / 255;
  if (color >= 256) {
    return `rgb(${Math.round(198 + intensity * 56)}, ${Math.round(102 + intensity * 95)}, ${Math.round(53 + intensity * 76)})`;
  }
  return `rgb(${Math.round(28 + 142 * intensity)}, ${Math.round(64 + 154 * intensity)}, ${Math.round(72 + 150 * intensity)})`;
}

class PointCloudViewer {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    this.frames = data.frames.map(readCloudFrame);
    this.scale = data.scale;
    this.frame = 0;
    this.colors = Array.from({ length: 512 }, (_, color) => pointColor(color));
    this.camera = { ...defaultCamera };
    this.pointers = new Map();

    this.bindControls();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement);
    this.resize();
  }

  setFrame(index) {
    if (index === this.frame) return;
    this.frame = Math.min(index, this.frames.length - 1);
    this.render();
  }

  reset() {
    this.camera = { ...defaultCamera };
    this.render();
  }

  orbit(yaw, pitch) {
    this.camera.yaw += yaw;
    this.camera.pitch = Math.max(-0.72, Math.min(1.16, this.camera.pitch + pitch));
    this.render();
  }

  zoom(factor) {
    this.camera.distance = Math.max(13, Math.min(54, this.camera.distance * factor));
    this.render();
  }

  pinchDistance() {
    const [first, second] = this.pointers.values();
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  bindControls() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (this.pointers.size >= 2) return;
      this.canvas.focus({ preventScroll: true });
      this.canvas.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    });

    this.canvas.addEventListener('pointermove', (event) => {
      const previous = this.pointers.get(event.pointerId);
      if (!previous) return;
      const pinching = this.pointers.size === 2;
      const oldDistance = pinching ? this.pinchDistance() : 0;
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinching) {
        const newDistance = this.pinchDistance();
        if (newDistance > 0 && oldDistance > 0) this.zoom(oldDistance / newDistance);
        return;
      }
      this.orbit((event.clientX - previous.x) * 0.008, (event.clientY - previous.y) * 0.008);
    });

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.canvas.addEventListener(type, (event) => this.pointers.delete(event.pointerId));
    }

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 18 : event.deltaY;
      this.zoom(Math.exp(Math.max(-400, Math.min(400, delta)) * 0.0016));
    }, { passive: false });

    this.canvas.addEventListener('keydown', (event) => {
      const actions = {
        ArrowLeft: () => this.orbit(-0.11, 0),
        ArrowRight: () => this.orbit(0.11, 0),
        ArrowUp: () => this.orbit(0, -0.11),
        ArrowDown: () => this.orbit(0, 0.11),
        '+': () => this.zoom(0.88),
        '=': () => this.zoom(0.88),
        '-': () => this.zoom(1.14),
        Home: () => this.reset(),
      };
      if (!Object.hasOwn(actions, event.key)) return;
      event.preventDefault();
      actions[event.key]();
    });
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.render();
  }

  render() {
    const { width, height, context } = this;
    if (!width || !height) return;
    const { yaw, pitch, distance } = this.camera;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const focal = width * 0.98;
    const centerX = width * 0.49;
    const centerY = height * 0.53;

    const project = (x, y, z) => {
      y -= 3.8;
      z -= 3.3;
      const right = x * cosYaw - z * sinYaw;
      const forward = x * sinYaw + z * cosYaw;
      const depth = distance + forward * cosPitch - y * sinPitch;
      const up = y * cosPitch + forward * sinPitch;
      return [centerX + focal * right / depth, centerY - focal * up / depth, depth];
    };

    context.fillStyle = '#101d22';
    context.fillRect(0, 0, width, height);
    this.drawGrid(project);

    const points = this.frames[this.frame];
    for (let offset = 0; offset < points.length; offset += 4) {
      const [x, y, depth] = project(
        points[offset] / this.scale,
        points[offset + 1] / this.scale,
        points[offset + 2] / this.scale,
      );
      if (depth < 2 || x < 0 || y < 0 || x >= width || y >= height) continue;
      const color = points[offset + 3];
      const size = Math.max(0.55, Math.min(2.3, width / (depth * 15) + (color >= 256 ? 0.4 : 0)));
      context.fillStyle = this.colors[color];
      context.fillRect(x, y, size, size);
    }
  }

  drawGrid(project) {
    const context = this.context;
    const line = (from, to) => {
      const a = project(...from);
      const b = project(...to);
      if (a[2] < 2 || b[2] < 2) return;
      context.moveTo(a[0], a[1]);
      context.lineTo(b[0], b[1]);
    };

    context.beginPath();
    for (let tick = -12; tick <= 16; tick += 2) {
      line([-15, -0.17, tick], [15, -0.17, tick]);
      line([tick, -0.17, -12], [tick, -0.17, 16]);
    }
    context.lineWidth = 0.8;
    context.strokeStyle = '#294246';
    context.stroke();
  }
}
