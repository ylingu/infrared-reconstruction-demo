const formatFrame = (frame) => String(frame).padStart(2, '0');
const seekPosition = (slider, position) => Math.max(0, Math.min(Number(slider.max) - 0.001, position));

function bindSeek(slider, seek) {
  slider.addEventListener('input', () => seek(seekPosition(slider, slider.valueAsNumber)));
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
  button.querySelector('[data-play-label]').textContent = playing ? '暂停' : '播放';
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
    this.position = controls.querySelector('[data-position]');
    this.error = error;
    this.onFrame = onFrame;
    this.displayedFrame = -1;
    this.progressAnimation = null;
    this.trackProgress = () => {
      this.updateProgress();
      this.progressAnimation = this.master.paused ? null : requestAnimationFrame(this.trackProgress);
    };

    this.button.addEventListener('click', () => this.togglePlayback());
    bindSeek(this.slider, (position) => this.seek(position));
    this.master.addEventListener('seeked', () => this.updateTime());
    this.master.addEventListener('play', () => this.setPlaying(true));
    this.master.addEventListener('pause', () => this.setPlaying(false));
    this.master.addEventListener('ended', () => this.pause());

    for (const video of this.videos) {
      video.addEventListener('error', () => this.fail());
      if (video.error) this.fail();
    }
    this.watchFrames();
    this.updateTime();
    this.setPlaying(!this.master.paused);
    if (this.master.autoplay && !this.button.disabled) void this.play();
  }

  watchFrames() {
    if (!this.master.requestVideoFrameCallback) {
      this.master.addEventListener('timeupdate', () => this.updateTime());
      return;
    }
    const onVideoFrame = (_, { mediaTime }) => {
      this.updateTime(mediaTime);
      this.master.requestVideoFrameCallback(onVideoFrame);
    };
    this.master.requestVideoFrameCallback(onVideoFrame);
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

  async play() {
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
    const time = position / this.frameRate;
    for (const video of this.videos) video.currentTime = time;
    this.slider.valueAsNumber = position;
    this.updateFrame(Math.floor(position));
  }

  updateProgress() {
    this.slider.valueAsNumber = Math.min(this.frameCount, this.master.currentTime * this.frameRate);
  }

  updateTime(mediaTime = this.master.currentTime) {
    const time = this.master.currentTime;
    const maxDrift = 0.5 / this.frameRate;
    for (const video of this.followers) {
      if (video.readyState > 0 && !video.seeking && Math.abs(video.currentTime - time) > maxDrift) {
        video.currentTime = Math.min(time, video.duration);
      }
    }
    const frame = Math.min(this.frameCount - 1, Math.floor(mediaTime * this.frameRate + 0.015));
    this.updateFrame(frame);
  }

  updateFrame(frame) {
    if (frame === this.displayedFrame) return;
    this.displayedFrame = frame;
    this.slider.setAttribute('aria-valuetext', `第 ${formatFrame(frame)} 帧`);
    this.position.value = `${formatFrame(frame)} / ${formatFrame(this.frameCount - 1)} 帧`;
    this.onFrame(frame);
  }

  fail() {
    this.pause();
    this.button.disabled = true;
    this.slider.disabled = true;
    this.error.hidden = false;
  }
}

const canvas = document.querySelector('#point-cloud');
const sourceVideo = document.querySelector('#source-video');
const pointCloud = window.demoCloud && canvas.getContext('2d', { alpha: false })
  ? new PointCloudViewer(canvas, window.demoCloud)
  : null;

const resetButton = document.querySelector('#reset-view');
if (pointCloud) {
  resetButton.addEventListener('click', () => pointCloud.reset());
} else {
  resetButton.disabled = true;
  document.querySelector('#cloud-help').textContent = '点云预览加载失败。';
}

new PlaybackGroup(
  document.querySelector('#reconstruction-controls'),
  [sourceVideo],
  document.querySelector('#source-error'),
  (frame) => pointCloud?.setFrame(frame),
);

new PlaybackGroup(
  document.querySelector('#mask-controls'),
  Array.from(document.querySelectorAll('#masks video')),
  document.querySelector('#mask-error'),
);

const interpolationFrames = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14];
class ComparisonPlayback {
  constructor(controls) {
    this.baseline = document.querySelector('#baseline');
    this.baselineCaption = document.querySelector('#baseline-caption');
    this.error = document.querySelector('#comparison-error');
    this.slider = controls.querySelector('[data-seek]');
    this.button = controls.querySelector('[data-play]');
    this.readout = controls.querySelector('[data-position]');
    this.frameRate = Number(controls.dataset.frameRate);
    this.slots = ['compare-reference', 'compare-baseline', 'compare-physir'].map((id) => ({
      id,
      container: document.getElementById(id).parentElement,
    }));
    this.position = 0;
    this.animation = null;
    this.frameSets = new Map();
    this.selection = 0;
    this.activeBaseline = null;

    this.tick = (now) => {
      const position = Math.max(0, (now - this.startTime) * this.frameRate / 1000);
      this.renderAt(position % interpolationFrames.length);
      this.animation = requestAnimationFrame(this.tick);
    };
    this.button.addEventListener('click', () => {
      if (this.animation === null) this.play();
      else this.pause();
    });
    bindSeek(this.slider, (position) => {
      this.renderAt(position);
      this.resetClock();
    });
    this.baseline.addEventListener('change', () => void this.selectBaseline());
    void this.selectBaseline();
  }

  loadFrames(folder) {
    if (!this.frameSets.has(folder)) {
      const load = Promise.all(interpolationFrames.map(async (frame) => {
        const image = new Image();
        const file = String(frame).padStart(5, '0');
        image.src = `./assets/compare/${folder}/${file}.png`;
        await image.decode();
        return image;
      })).catch((error) => {
        this.frameSets.delete(folder);
        throw error;
      });
      this.frameSets.set(folder, load);
    }
    return this.frameSets.get(folder);
  }

  async selectBaseline() {
    const selection = ++this.selection;
    const method = this.baseline.value;
    const label = this.baseline.selectedOptions[0].textContent;
    this.error.hidden = true;
    try {
      const frames = await Promise.all(['reference', method, 'physir'].map((folder) => this.loadFrames(folder)));
      if (selection !== this.selection) return;
      const firstLoad = this.activeBaseline === null;
      this.activeBaseline = method;
      this.frames = frames;
      this.labels = ['真值', label, 'PhysIR 默认 TI'];
      this.baselineCaption.textContent = label;
      this.renderAt(this.position, true);
      if (firstLoad) {
        this.slider.disabled = false;
        this.button.disabled = false;
        this.play();
        for (const option of this.baseline.options) {
          if (option.value !== method) void this.loadFrames(option.value).catch(() => {});
        }
      }
    } catch {
      if (selection !== this.selection) return;
      if (this.activeBaseline) this.baseline.value = this.activeBaseline;
      else showPlaying(this.button, false);
      this.error.hidden = false;
    }
  }

  resetClock() {
    this.startTime = performance.now() - this.position / this.frameRate * 1000;
  }

  play() {
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
    const index = Math.floor(position);
    if (!methodChanged && index === this.frameIndex) return;

    this.frameIndex = index;
    const name = `第 ${formatFrame(interpolationFrames[index])} 帧`;
    this.readout.value = name;
    this.slider.setAttribute('aria-valuetext', name);
    this.slots.forEach(({ id, container }, pane) => {
      const image = this.frames[pane][index];
      image.id = id;
      image.alt = `${name} · ${this.labels[pane]}`;
      container.replaceChildren(image);
    });
  }
}

new ComparisonPlayback(document.querySelector('#comparison-controls'));

const copyBibtex = document.querySelector('#copy-bibtex');
const copyStatus = document.querySelector('#copy-status');
if (navigator.clipboard?.writeText) {
  copyBibtex.hidden = false;
  copyBibtex.addEventListener('click', async () => {
    const entry = document.querySelector('#bibtex-entry').textContent;
    try {
      await navigator.clipboard.writeText(entry);
      copyStatus.textContent = '已复制 BibTeX。';
    } catch {
      copyStatus.textContent = '请选择引用文本并手动复制。';
    }
    copyStatus.hidden = false;
  });
}
