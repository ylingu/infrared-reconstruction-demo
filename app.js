const formatFrame = (frame) => String(frame).padStart(2, '0');
const seekPosition = (slider, position) => Math.max(0, Math.min(Number(slider.max) - 0.001, position));

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let isReducedMotion = reducedMotionQuery.matches;

function setSliderProgress(slider) {
  const min = Number(slider.min || 0);
  const max = Number(slider.max || 1);
  const val = Number.isFinite(slider.valueAsNumber) ? slider.valueAsNumber : min;
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  slider.style.setProperty('--progress', `${Math.max(0, Math.min(100, pct)).toFixed(2)}%`);
}

function bindSeek(slider, seek) {
  slider.addEventListener('input', () => {
    setSliderProgress(slider);
    seek(seekPosition(slider, slider.valueAsNumber));
  });
  slider.addEventListener('keydown', (event) => {
    const directions = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    seek(seekPosition(slider, Math.floor(slider.valueAsNumber) + direction));
  });
}

function showPlaying(button, playing) {
  button.dataset.playing = String(playing);
  const label = button.querySelector('[data-play-label]');
  if (label) label.textContent = playing ? 'Pause' : 'Play';
}

function isVideoSeekable(video) {
  return video.seekable.length > 0 && video.seekable.end(video.seekable.length - 1) > 0.01;
}

class PlaybackGroup {
  constructor(controls, videos, error, onFrame = () => {}) {
    this.master = videos[0];
    this.followers = videos.slice(1);
    this.videos = videos;
    this.frameRate = Number(controls.dataset.frameRate);
    this.slider = controls.querySelector('[data-seek]');
    this.frameCount = Number(this.slider.max);
    this.button = controls.querySelector('[data-play]');
    this.stepButtons = Array.from(controls.querySelectorAll('[data-step]'));
    this.position = controls.querySelector('[data-position]');
    this.error = error;
    this.onFrame = onFrame;
    this.displayedFrame = -1;
    this.progressAnimation = null;
    this.frameCallbackId = null;
    this.timeupdateAttached = false;
    this.pendingSeekTime = null;
    this.shouldPlay = !isReducedMotion && Boolean(this.master.autoplay);

    this.trackProgress = () => {
      this.updateProgress();
      this.progressAnimation = this.master.paused ? null : requestAnimationFrame(this.trackProgress);
    };

    this.button.addEventListener('click', () => this.togglePlayback());
    for (const stepButton of this.stepButtons) {
      stepButton.addEventListener('click', () => {
        const delta = Number(stepButton.dataset.step);
        this.stepBy(delta);
      });
    }

    bindSeek(this.slider, (position) => this.seek(position));
    this.master.addEventListener('seeked', () => this.updateTime());
    this.master.addEventListener('play', () => this.setPlaying(true));
    this.master.addEventListener('pause', () => this.setPlaying(false));
    this.master.addEventListener('ended', () => this.pause());

    for (const video of this.videos) {
      video.addEventListener('error', () => this.fail());
      if (video.error) this.fail();
      if (window.location.protocol !== 'file:') {
        video.addEventListener('loadedmetadata', () => {
          void this.ensureSeekable(video);
        });
        if (video.readyState >= 1) {
          void this.ensureSeekable(video);
        }
      }
    }

    this.watchFrames();
    this.updateTime();

    if (isReducedMotion) {
      this.shouldPlay = false;
      for (const video of this.videos) {
        video.autoplay = false;
        video.pause();
      }
      this.seek(0);
      this.setPlaying(false);
    } else {
      this.setPlaying(!this.master.paused);
      if (this.master.autoplay && !this.button.disabled) {
        void this.play();
      }
    }
  }

  async ensureSeekable(video) {
    if (window.location.protocol === 'file:') return;
    if (video.dataset.blobHydrated || isVideoSeekable(video)) return;
    const sourceUrl = video.currentSrc || video.src;
    if (!sourceUrl || sourceUrl.startsWith('blob:')) return;

    video.dataset.blobHydrated = 'pending';
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        delete video.dataset.blobHydrated;
        return;
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const targetTime = this.pendingSeekTime !== null ? this.pendingSeekTime : this.master.currentTime;

      video.dataset.blobHydrated = 'done';
      video.addEventListener('loadedmetadata', () => {
        const applyTime = this.pendingSeekTime !== null
          ? this.pendingSeekTime
          : (video === this.master ? targetTime : this.master.currentTime);
        if (Number.isFinite(applyTime)) {
          video.currentTime = Math.max(0, Math.min(applyTime, video.duration || applyTime));
        }
        if (video === this.master) {
          this.pendingSeekTime = null;
          this.watchFrames();
        }
        if (this.shouldPlay && !isReducedMotion) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      }, { once: true });

      video.src = blobUrl;
    } catch {
      delete video.dataset.blobHydrated;
    }
  }

  watchFrames() {
    if (!this.master.requestVideoFrameCallback) {
      if (!this.timeupdateAttached) {
        this.timeupdateAttached = true;
        this.master.addEventListener('timeupdate', () => this.updateTime());
      }
      return;
    }
    if (this.frameCallbackId !== null && this.master.cancelVideoFrameCallback) {
      this.master.cancelVideoFrameCallback(this.frameCallbackId);
      this.frameCallbackId = null;
    }
    const onVideoFrame = (_, { mediaTime }) => {
      this.updateTime(mediaTime);
      this.frameCallbackId = this.master.requestVideoFrameCallback(onVideoFrame);
    };
    this.frameCallbackId = this.master.requestVideoFrameCallback(onVideoFrame);
  }

  setPlaying(playing) {
    showPlaying(this.button, playing);
    if (playing) {
      if (this.progressAnimation === null) this.trackProgress();
      return;
    }
    cancelAnimationFrame(this.progressAnimation);
    this.progressAnimation = null;
    this.updateProgress();
  }

  pause() {
    this.shouldPlay = false;
    for (const video of this.videos) video.pause();
    this.setPlaying(false);
  }

  togglePlayback() {
    if (!this.master.paused) {
      this.pause();
      return;
    }
    if (this.master.ended) this.seek(0);
    void this.play();
  }

  stepBy(delta) {
    this.pause();
    const current = this.displayedFrame >= 0 ? this.displayedFrame : Math.floor(this.slider.valueAsNumber);
    const next = (current + delta + this.frameCount) % this.frameCount;
    this.seek(seekPosition(this.slider, next + 0.05));
  }

  async play() {
    this.shouldPlay = true;
    try {
      await Promise.all(this.videos.map((video) => video.play()));
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        this.pause();
        return;
      }
      this.fail();
    }
  }

  seek(position) {
    const clamped = seekPosition(this.slider, position);
    const time = clamped / this.frameRate;
    if (window.location.protocol !== 'file:' && !isVideoSeekable(this.master)) {
      this.pendingSeekTime = time;
    } else {
      this.pendingSeekTime = null;
      for (const video of this.videos) {
        if (video.readyState > 0) {
          video.currentTime = Math.min(time, video.duration || time);
        } else {
          video.currentTime = time;
        }
      }
    }
    this.slider.valueAsNumber = clamped;
    setSliderProgress(this.slider);
    this.updateFrame(Math.min(this.frameCount - 1, Math.floor(clamped)));
  }

  updateProgress() {
    if (this.pendingSeekTime !== null) return;
    if (window.location.protocol !== 'file:' && this.master.paused && !isVideoSeekable(this.master)) return;
    this.slider.valueAsNumber = Math.min(this.frameCount, this.master.currentTime * this.frameRate);
    setSliderProgress(this.slider);
  }

  updateTime(mediaTime = this.master.currentTime) {
    if (this.pendingSeekTime !== null) return;
    if (window.location.protocol !== 'file:' && this.master.paused && !isVideoSeekable(this.master)) return;
    const time = this.master.currentTime;
    const maxDrift = 0.5 / this.frameRate;
    for (const video of this.followers) {
      if (video.readyState > 0 && !video.seeking && Math.abs(video.currentTime - time) > maxDrift) {
        video.currentTime = Math.min(time, video.duration);
      }
    }
    const frame = Math.min(this.frameCount - 1, Math.floor(mediaTime * this.frameRate + 0.02));
    this.updateFrame(frame);
  }

  updateFrame(frame) {
    if (frame === this.displayedFrame) return;
    this.displayedFrame = frame;
    this.slider.setAttribute('aria-valuetext', `Frame ${formatFrame(frame)} of ${formatFrame(this.frameCount - 1)}`);
    this.position.value = `${formatFrame(frame)} / ${formatFrame(this.frameCount - 1)}`;
    this.onFrame(frame);
  }

  fail() {
    this.pause();
    this.button.disabled = true;
    this.slider.disabled = true;
    for (const stepButton of this.stepButtons) stepButton.disabled = true;
    this.error.hidden = false;
  }
}

/* Section 1: 3D Point Cloud HUD & Playback */
const canvas = document.querySelector('#point-cloud');
const sourceVideo = document.querySelector('#source-video');
const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));
const layerButtons = Array.from(document.querySelectorAll('[data-layer]'));
const resetButton = document.querySelector('#reset-view');

function syncPresetButtons(activePreset) {
  for (const button of presetButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.preset === activePreset));
  }
}

const pointCloud = window.demoCloud && canvas.getContext('2d', { alpha: false })
  ? new PointCloudViewer(canvas, window.demoCloud, {
      reducedMotion: isReducedMotion,
      onCameraChange: syncPresetButtons,
    })
  : null;

if (pointCloud) {
  const supportsPresets = typeof pointCloud.setPreset === 'function';
  const supportsLayers = typeof pointCloud.setLayerFilter === 'function';

  for (const button of presetButtons) {
    if (!supportsPresets && button.dataset.preset !== 'default') {
      button.disabled = true;
      button.title = 'Camera presets require the upgraded viewer.js';
    }
    button.addEventListener('click', () => {
      if (supportsPresets) {
        pointCloud.setPreset(button.dataset.preset);
      } else if (button.dataset.preset === 'default') {
        pointCloud.reset();
        syncPresetButtons('default');
      }
    });
  }
  resetButton.addEventListener('click', () => {
    pointCloud.reset();
    if (!supportsPresets) syncPresetButtons('default');
  });
  for (const button of layerButtons) {
    if (!supportsLayers && button.dataset.layer !== 'all') {
      button.disabled = true;
      button.title = 'Layer filtering requires the upgraded viewer.js';
    }
    button.addEventListener('click', () => {
      if (!supportsLayers) return;
      const layer = button.dataset.layer;
      pointCloud.setLayerFilter(layer);
      for (const sibling of layerButtons) {
        sibling.setAttribute('aria-pressed', String(sibling === button));
      }
    });
  }
} else {
  resetButton.disabled = true;
  for (const button of [...presetButtons, ...layerButtons]) button.disabled = true;
  document.querySelector('#cloud-help').textContent = '3D point cloud preview failed to initialize.';
}

const reconstructionPlayback = new PlaybackGroup(
  document.querySelector('#reconstruction-controls'),
  [sourceVideo],
  document.querySelector('#source-error'),
  (frame) => pointCloud?.setFrame(frame),
);

const maskPlayback = new PlaybackGroup(
  document.querySelector('#mask-controls'),
  Array.from(document.querySelectorAll('#masks video')),
  document.querySelector('#mask-error'),
);

/* Section 4: 2D Qualitative Comparison & Split Wipe */
const interpolationFrames = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14];
const BASELINE_LABELS = {
  tapip3d: 'DGGT + TAPIP3D',
  rife: 'DGGT + RIFE',
};

class ComparisonPlayback {
  constructor(controls) {
    this.controls = controls;
    this.baselineButtons = Array.from(document.querySelectorAll('[data-baseline]'));
    this.viewModeButtons = Array.from(document.querySelectorAll('[data-view-mode]'));
    this.sideContainer = document.querySelector('#comparison-side');
    this.wipeContainer = document.querySelector('#comparison-wipe');
    this.baselineCaption = document.querySelector('#baseline-caption');
    this.error = document.querySelector('#comparison-error');
    this.slider = controls.querySelector('[data-seek]');
    this.button = controls.querySelector('[data-play]');
    this.stepButtons = Array.from(controls.querySelectorAll('[data-step]'));
    this.readout = controls.querySelector('[data-position]');
    this.frameRate = Number(controls.dataset.frameRate);

    this.slots = ['compare-reference', 'compare-baseline', 'compare-physir'].map((id) => ({
      id,
      container: document.getElementById(id).parentElement,
    }));

    this.wipeStage = document.querySelector('#wipe-stage');
    this.wipeHandle = document.querySelector('#wipe-handle');
    this.wipeLeftImg = document.querySelector('#wipe-left-img');
    this.wipeRightImg = document.querySelector('#wipe-right-img');
    this.wipeLeftBadge = document.querySelector('#wipe-left-badge');
    this.wipeRightBadge = document.querySelector('#wipe-right-badge');
    this.wipeLeftSelect = document.querySelector('#wipe-left-select');
    this.wipeRightSelect = document.querySelector('#wipe-right-select');

    this.position = 0;
    this.frameIndex = 0;
    this.animation = null;
    this.singleFrames = new Map();
    this.frameSets = new Map();
    this.selection = 0;
    this.selectedBaseline = 'tapip3d';
    this.activeBaseline = null;
    this.viewMode = 'side';
    this.wipePercent = 50;

    this.tick = (now) => {
      const position = Math.max(0, ((now - this.startTime) * this.frameRate) / 1000);
      this.renderAt(position % interpolationFrames.length);
      this.animation = requestAnimationFrame(this.tick);
    };

    this.button.addEventListener('click', () => {
      if (this.animation === null) this.play();
      else this.pause();
    });

    for (const stepButton of this.stepButtons) {
      stepButton.addEventListener('click', () => {
        this.pause();
        const delta = Number(stepButton.dataset.step);
        const total = interpolationFrames.length;
        const current = Math.floor(this.position);
        const next = (current + delta + total) % total;
        this.renderAt(next, true);
        this.resetClock();
      });
    }

    bindSeek(this.slider, (position) => {
      this.renderAt(position);
      this.resetClock();
    });

    for (const button of this.baselineButtons) {
      button.addEventListener('click', () => {
        const nextMethod = button.dataset.baseline;
        if (nextMethod === this.selectedBaseline) return;
        this.selectedBaseline = nextMethod;
        for (const sibling of this.baselineButtons) {
          sibling.setAttribute('aria-pressed', String(sibling === button));
        }
        void this.selectBaseline(nextMethod);
      });
    }

    for (const button of this.viewModeButtons) {
      button.addEventListener('click', () => this.setViewMode(button.dataset.viewMode));
    }

    this.wipeLeftSelect.addEventListener('change', () => this.renderWipeFrame(this.frameIndex));
    this.wipeRightSelect.addEventListener('change', () => this.renderWipeFrame(this.frameIndex));
    this.bindWipeInteractions();
    setSliderProgress(this.slider);

    void this.initProgressive();
  }

  loadSingleFrame(folder, frameNumber) {
    const key = `${folder}/${frameNumber}`;
    if (!this.singleFrames.has(key)) {
      const promise = (async () => {
        const image = new Image();
        const file = String(frameNumber).padStart(5, '0');
        image.src = `./assets/compare/${folder}/${file}.png`;
        await image.decode();
        return image;
      })().catch((error) => {
        this.singleFrames.delete(key);
        throw error;
      });
      this.singleFrames.set(key, promise);
    }
    return this.singleFrames.get(key);
  }

  loadFrames(folder) {
    if (!this.frameSets.has(folder)) {
      const load = Promise.all(
        interpolationFrames.map((frame) => this.loadSingleFrame(folder, frame)),
      ).catch((error) => {
        this.frameSets.delete(folder);
        throw error;
      });
      this.frameSets.set(folder, load);
    }
    return this.frameSets.get(folder);
  }

  async initProgressive() {
    this.error.hidden = true;
    try {
      // Decode first frame (00001.png) immediately for active panes before loading remaining frames.
      const firstFrame = interpolationFrames[0];
      const initialImages = await Promise.all([
        this.loadSingleFrame('reference', firstFrame),
        this.loadSingleFrame('tapip3d', firstFrame),
        this.loadSingleFrame('physir', firstFrame),
      ]);
      this.frames = initialImages.map((img) => [img]);
      this.labels = ['Reference · Ground Truth', `Baseline · ${BASELINE_LABELS.tapip3d}`, 'Baseline · PhysIR (Default TI)'];
      this.activeBaseline = 'tapip3d';
      this.renderAt(0, true);

      // Load full 12-frame sets for active methods.
      await this.selectBaseline('tapip3d', true);

      // Defer loading inactive DGGT + RIFE frames until idle.
      const preloadRife = () => {
        void this.loadFrames('rife').catch(() => {});
      };
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preloadRife, { timeout: 1500 });
      } else {
        setTimeout(preloadRife, 900);
      }
    } catch {
      const label = this.button.querySelector('[data-play-label]');
      if (label) label.textContent = 'Unavailable';
      this.error.hidden = false;
    }
  }

  async selectBaseline(method, isInitial = false) {
    const selection = ++this.selection;
    const label = BASELINE_LABELS[method];
    this.error.hidden = true;

    try {
      const frames = await Promise.all(['reference', method, 'physir'].map((folder) => this.loadFrames(folder)));
      if (selection !== this.selection) return;

      this.activeBaseline = method;
      this.frames = frames;
      this.labels = [`Reference · Ground Truth`, `Baseline · ${label}`, 'Baseline · PhysIR (Default TI)'];
      this.baselineCaption.textContent = label;
      this.updateDggtSelectLabels(label);
      this.renderAt(this.position, true);

      if (isInitial) {
        this.slider.disabled = false;
        this.button.disabled = false;
        for (const stepButton of this.stepButtons) stepButton.disabled = false;
        if (isReducedMotion) {
          showPlaying(this.button, false);
        } else {
          this.play();
        }
      }
    } catch {
      if (selection !== this.selection) return;
      if (this.activeBaseline) {
        this.selectedBaseline = this.activeBaseline;
        for (const sibling of this.baselineButtons) {
          sibling.setAttribute('aria-pressed', String(sibling.dataset.baseline === this.activeBaseline));
        }
      } else {
        showPlaying(this.button, false);
      }
      this.error.hidden = false;
    }
  }

  updateDggtSelectLabels(label) {
    for (const select of [this.wipeLeftSelect, this.wipeRightSelect]) {
      const dggtOption = select.querySelector('option[value="dggt"]');
      if (dggtOption) dggtOption.textContent = `${label} (Baseline)`;
    }
  }

  setViewMode(mode) {
    if (mode !== 'side' && mode !== 'wipe') return;
    this.viewMode = mode;
    for (const button of this.viewModeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.viewMode === mode));
    }
    this.sideContainer.hidden = mode !== 'side';
    this.wipeContainer.hidden = mode !== 'wipe';
    this.renderWipeFrame(this.frameIndex);
  }

  bindWipeInteractions() {
    let dragging = false;

    const updateFromClientX = (clientX) => {
      const rect = this.wipeStage.getBoundingClientRect();
      if (!rect.width) return;
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      this.setWipePercent(pct);
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      this.wipeStage.setPointerCapture(event.pointerId);
      updateFromClientX(event.clientX);
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      updateFromClientX(event.clientX);
    };

    const stopDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      if (this.wipeStage.hasPointerCapture(event.pointerId)) {
        this.wipeStage.releasePointerCapture(event.pointerId);
      }
    };

    this.wipeStage.addEventListener('pointerdown', onPointerDown);
    this.wipeStage.addEventListener('pointermove', onPointerMove);
    this.wipeStage.addEventListener('pointerup', stopDrag);
    this.wipeStage.addEventListener('pointercancel', stopDrag);
    this.wipeStage.addEventListener('lostpointercapture', () => {
      dragging = false;
    });

    this.wipeHandle.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 10 : 2;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.setWipePercent(this.wipePercent - step);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.setWipePercent(this.wipePercent + step);
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.setWipePercent(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this.setWipePercent(100);
      }
    });
  }

  setWipePercent(pct) {
    this.wipePercent = Math.max(0, Math.min(100, pct));
    this.wipeStage.style.setProperty('--wipe', `${this.wipePercent.toFixed(2)}%`);
    this.wipeHandle.setAttribute('aria-valuenow', String(Math.round(this.wipePercent)));
  }

  resolveLayerImage(choice, index) {
    const paneIndex = choice === 'reference' ? 0 : choice === 'dggt' ? 1 : 2;
    const set = this.frames?.[paneIndex];
    const image = set?.[index] || set?.[0];
    return {
      src: image?.src || '',
      label: this.labels?.[paneIndex] || '',
    };
  }

  renderWipeFrame(index) {
    if (!this.frames) return;
    const left = this.resolveLayerImage(this.wipeLeftSelect.value, index);
    const right = this.resolveLayerImage(this.wipeRightSelect.value, index);
    const frameLabel = `Frame ${formatFrame(interpolationFrames[index])}`;

    if (left.src && this.wipeLeftImg.src !== left.src) this.wipeLeftImg.src = left.src;
    if (right.src && this.wipeRightImg.src !== right.src) this.wipeRightImg.src = right.src;

    this.wipeLeftImg.alt = `${frameLabel} left layer: ${left.label}`;
    this.wipeRightImg.alt = `${frameLabel} right layer: ${right.label}`;
    this.wipeLeftBadge.textContent = left.label;
    this.wipeRightBadge.textContent = right.label;
  }

  resetClock() {
    this.startTime = performance.now() - (this.position / this.frameRate) * 1000;
  }

  play() {
    if (this.animation !== null) return;
    this.resetClock();
    showPlaying(this.button, true);
    this.animation = requestAnimationFrame(this.tick);
  }

  pause() {
    cancelAnimationFrame(this.animation);
    this.animation = null;
    showPlaying(this.button, false);
  }

  renderAt(position, methodChanged = false) {
    this.position = position;
    this.slider.valueAsNumber = position;
    setSliderProgress(this.slider);

    const maxAvailable = (this.frames?.[0]?.length || 1) - 1;
    const index = Math.min(maxAvailable, Math.floor(position));
    if (!methodChanged && index === this.frameIndex) return;

    this.frameIndex = index;
    const frameNum = formatFrame(interpolationFrames[index]);
    const readoutText = `Frame ${frameNum} · ${index + 1}/${interpolationFrames.length}`;
    this.readout.value = readoutText;
    this.slider.setAttribute('aria-valuetext', readoutText);

    this.slots.forEach(({ id, container }, pane) => {
      const image = this.frames[pane][index];
      if (!image) return;
      image.id = id;
      image.alt = `Frame ${frameNum} · ${this.labels[pane]}`;
      container.replaceChildren(image);
    });

    this.renderWipeFrame(index);
  }
}

const comparisonPlayback = new ComparisonPlayback(document.querySelector('#comparison-controls'));

reducedMotionQuery.addEventListener('change', (event) => {
  isReducedMotion = event.matches;
  pointCloud?.setReducedMotion?.(isReducedMotion);
  if (isReducedMotion) {
    reconstructionPlayback.pause();
    maskPlayback.pause();
    comparisonPlayback.pause();
  }
});

/* Section 7: Copy BibTeX & Back to Top */
const copyBibtexButton = document.querySelector('#copy-bibtex');
const copyStatus = document.querySelector('#copy-status');

function fallbackCopyText(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  return ok;
}

copyBibtexButton.addEventListener('click', async () => {
  const entry = document.querySelector('#bibtex-entry').textContent.trim();
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(entry);
      copied = true;
    } catch {
      copied = fallbackCopyText(entry);
    }
  } else {
    copied = fallbackCopyText(entry);
  }
  copyStatus.textContent = copied
    ? 'Copied BibTeX entry to clipboard.'
    : 'Unable to access clipboard automatically; select and copy the citation block manually.';
  copyStatus.hidden = false;
});

const backToTopLink = document.querySelector('#back-to-top');
backToTopLink.addEventListener('click', (event) => {
  event.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: isReducedMotion ? 'auto' : 'smooth',
  });
});
