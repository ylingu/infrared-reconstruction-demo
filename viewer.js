const CAMERA_PRESETS = {
  default: { yaw: -0.26, pitch: 0.34, distance: 27 },
  top: { yaw: 0, pitch: 1.08, distance: 31 },
  front: { yaw: 0, pitch: 0.14, distance: 24 },
};

const DEPTH_BRIGHTNESS = [1.0, 0.87, 0.74, 0.6];
const GRID_BUCKETS = [
  { maxDist: 5.5, stroke: '#284454' },
  { maxDist: 10.5, stroke: '#1E3442' },
  { maxDist: 15.0, stroke: 'rgba(30, 52, 66, 0.52)' },
  { maxDist: Infinity, stroke: 'rgba(30, 52, 66, 0.22)' },
];

function readCloudFrame(encodedFrame) {
  const binary = atob(encodedFrame);
  const frame = new Int16Array(binary.length / 2);
  for (let offset = 0; offset < binary.length; offset += 2) {
    frame[offset / 2] = binary.charCodeAt(offset) | (binary.charCodeAt(offset + 1) << 8);
  }
  return frame;
}

function buildAttenuatedPalette() {
  const bgR = 13;
  const bgG = 23;
  const bgB = 32;
  const palette = new Array(DEPTH_BRIGHTNESS.length * 512);

  for (let tier = 0; tier < DEPTH_BRIGHTNESS.length; tier++) {
    const bright = DEPTH_BRIGHTNESS[tier];
    const baseOffset = tier * 512;

    for (let color = 0; color < 512; color++) {
      const isMotion = color >= 256;
      const intensity = (color % 256) / 255;
      let r;
      let g;
      let b;

      if (isMotion) {
        // Warm thermal orange (#FF9E57) rising to luminous thermal highlight (#FFD29D)
        r = 235 + intensity * 20;
        g = 128 + intensity * 82;
        b = 62 + intensity * 95;
      } else {
        // Cool cyan static structure (#4D8FA6 -> #8AD8CE)
        r = 46 + intensity * 92;
        g = 104 + intensity * 112;
        b = 126 + intensity * 80;
      }

      const outR = Math.round(bgR + (r - bgR) * bright);
      const outG = Math.round(bgG + (g - bgG) * bright);
      const outB = Math.round(bgB + (b - bgB) * bright);
      palette[baseOffset + color] = `rgb(${outR}, ${outG}, ${outB})`;
    }
  }

  return palette;
}

class PointCloudViewer {
  constructor(canvas, data, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    this.frames = data.frames.map(readCloudFrame);
    this.scale = data.scale;
    this.frame = 0;
    this.layerFilter = 'all';
    this.reducedMotion = Boolean(options.reducedMotion);
    this.onCameraChange = typeof options.onCameraChange === 'function' ? options.onCameraChange : null;
    this.palette = buildAttenuatedPalette();
    this.camera = { ...CAMERA_PRESETS.default };
    this.activePreset = 'default';
    this.transitionRaf = null;
    this.pointers = new Map();

    this.bindControls();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement);
    this.resize();
  }

  setReducedMotion(flag) {
    this.reducedMotion = Boolean(flag);
  }

  setFrame(index) {
    const clamped = Math.max(0, Math.min(index, this.frames.length - 1));
    if (clamped === this.frame) return;
    this.frame = clamped;
    this.render();
  }

  setLayerFilter(mode) {
    if (mode !== 'all' && mode !== 'structure' && mode !== 'motion') return;
    if (this.layerFilter === mode) return;
    this.layerFilter = mode;
    this.render();
  }

  cancelTransition() {
    if (this.transitionRaf !== null) {
      cancelAnimationFrame(this.transitionRaf);
      this.transitionRaf = null;
    }
  }

  setPreset(name, immediate = false) {
    const target = CAMERA_PRESETS[name];
    if (!target) return;
    this.activePreset = name;
    this.onCameraChange?.(name);
    this.cancelTransition();

    if (immediate || this.reducedMotion) {
      this.camera = { ...target };
      this.render();
      return;
    }

    const start = { ...this.camera };
    const startTime = performance.now();
    const duration = 260;

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      this.camera.yaw = start.yaw + (target.yaw - start.yaw) * eased;
      this.camera.pitch = start.pitch + (target.pitch - start.pitch) * eased;
      this.camera.distance = start.distance + (target.distance - start.distance) * eased;
      this.render();

      if (t < 1) {
        this.transitionRaf = requestAnimationFrame(step);
      } else {
        this.transitionRaf = null;
      }
    };

    this.transitionRaf = requestAnimationFrame(step);
  }

  reset(immediate = false) {
    this.setPreset('default', immediate);
  }

  markCustomCamera() {
    if (this.activePreset !== null) {
      this.activePreset = null;
      this.onCameraChange?.(null);
    }
  }

  orbit(yaw, pitch) {
    this.cancelTransition();
    this.markCustomCamera();
    this.camera.yaw += yaw;
    this.camera.pitch = Math.max(-0.72, Math.min(1.16, this.camera.pitch + pitch));
    this.render();
  }

  zoom(factor) {
    this.cancelTransition();
    this.markCustomCamera();
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

    this.canvas.addEventListener('dblclick', () => this.reset());

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
        r: () => this.reset(),
        R: () => this.reset(),
        0: () => this.reset(),
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
      const sy = y - 3.8;
      const sz = z - 3.3;
      const right = x * cosYaw - sz * sinYaw;
      const forward = x * sinYaw + sz * cosYaw;
      const depth = distance + forward * cosPitch - sy * sinPitch;
      const up = sy * cosPitch + forward * sinPitch;
      return [centerX + (focal * right) / depth, centerY - (focal * up) / depth, depth];
    };

    context.fillStyle = '#0D1720';
    context.fillRect(0, 0, width, height);
    this.drawGrid(project);

    const points = this.frames[this.frame];
    const filter = this.layerFilter;
    const invScale = 1 / this.scale;

    for (let offset = 0; offset < points.length; offset += 4) {
      const color = points[offset + 3];
      const isMotion = color >= 256;
      if (filter === 'structure' && isMotion) continue;
      if (filter === 'motion' && !isMotion) continue;

      const [x, y, depth] = project(
        points[offset] * invScale,
        points[offset + 1] * invScale,
        points[offset + 2] * invScale,
      );
      if (depth < 2 || x < 0 || y < 0 || x >= width || y >= height) continue;

      const tier = depth < 14 ? 0 : depth < 22 ? 1 : depth < 31 ? 2 : 3;
      const size = Math.max(0.65, Math.min(2.6, width / (depth * 14.5) + (isMotion ? 0.38 : 0)));
      context.fillStyle = this.palette[tier * 512 + color];
      context.fillRect(x, y, size, size);
    }
  }

  drawGrid(project) {
    const { context } = this;
    const bucketSegments = [[], [], [], []];
    const floorY = -0.17;

    const addSegment = (x1, z1, x2, z2) => {
      const midX = (x1 + x2) * 0.5;
      const midZ = (z1 + z2) * 0.5 - 3.3;
      const dist = Math.hypot(midX, midZ);
      let bucketIdx = 3;
      for (let i = 0; i < GRID_BUCKETS.length; i++) {
        if (dist < GRID_BUCKETS[i].maxDist) {
          bucketIdx = i;
          break;
        }
      }
      const a = project(x1, floorY, z1);
      const b = project(x2, floorY, z2);
      if (a[2] < 2 || b[2] < 2) return;
      bucketSegments[bucketIdx].push(a[0], a[1], b[0], b[1]);
    };

    for (let z = -12; z <= 16; z += 2) {
      for (let x = -14; x < 14; x += 2) {
        addSegment(x, z, x + 2, z);
      }
    }

    for (let x = -14; x <= 14; x += 2) {
      for (let z = -12; z < 16; z += 2) {
        addSegment(x, z, x, z + 2);
      }
    }

    context.lineWidth = 0.85;
    for (let i = 0; i < GRID_BUCKETS.length; i++) {
      const segs = bucketSegments[i];
      if (!segs.length) continue;
      context.beginPath();
      for (let j = 0; j < segs.length; j += 4) {
        context.moveTo(segs[j], segs[j + 1]);
        context.lineTo(segs[j + 2], segs[j + 3]);
      }
      context.strokeStyle = GRID_BUCKETS[i].stroke;
      context.stroke();
    }
  }
}
