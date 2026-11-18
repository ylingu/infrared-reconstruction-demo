const formatFrame = (frame) => String(frame).padStart(2, '0');

class PlaybackGroup {
  constructor(controls, videos, error, onFrame = () => {}) {
    this.master = videos[0];
    this.followers = videos.slice(1);
    this.videos = videos;
    this.frameRate = Number(controls.dataset.frameRate);
    this.slider = controls.querySelector('[data-seek]');
    this.maxFrame = Number(this.slider.max);
    this.button = controls.querySelector('[data-play]');
    this.buttonLabel = controls.querySelector('[data-play-label]');
    this.position = controls.querySelector('[data-position]');
    this.error = error;
    this.onFrame = onFrame;

    this.button.addEventListener('click', () => this.togglePlayback());
    this.slider.addEventListener('input', () => this.seek(Number(this.slider.value)));
    this.master.addEventListener('seeked', () => this.updateTime());
    this.master.addEventListener('play', () => this.setPlaying(true));
    this.master.addEventListener('pause', () => this.setPlaying(false));
    this.master.addEventListener('ended', () => this.pause());

    for (const video of this.videos) {
      video.addEventListener('error', () => this.fail());
      if (video.error) this.fail();
    }
    this.watchFrames();
    this.updateFrame(0);
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
    this.button.dataset.playing = String(playing);
    this.buttonLabel.textContent = playing ? '暂停' : '播放';
  }

  pause() {
    for (const video of this.videos) video.pause();
    this.setPlaying(false);
  }

  async togglePlayback() {
    if (!this.master.paused) {
      this.pause();
      return;
    }

    if (this.master.ended) this.seek(0);
    try {
      await Promise.all(this.videos.map((video) => video.play()));
    } catch (error) {
      if (error.name === 'AbortError') return;
      this.fail();
    }
  }

  seek(frame) {
    const time = frame / this.frameRate;
    for (const video of this.videos) video.currentTime = time;
    this.updateFrame(frame);
  }

  updateTime(mediaTime = this.master.currentTime) {
    const time = this.master.currentTime;
    for (const video of this.followers) {
      if (video.readyState > 0 && Math.abs(video.currentTime - time) > 0.16) {
        video.currentTime = Math.min(time, video.duration);
      }
    }
    const frame = Math.min(this.maxFrame, Math.floor(mediaTime * this.frameRate + 0.015));
    this.updateFrame(frame);
  }

  updateFrame(frame) {
    this.slider.value = frame;
    this.slider.setAttribute('aria-valuetext', `第 ${formatFrame(frame)} 帧`);
    this.position.value = `${formatFrame(frame)} / ${formatFrame(this.maxFrame)} 帧`;
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
const baseline = document.querySelector('#baseline');
const comparisonFrame = document.querySelector('#comparison-frame');
const comparisonPosition = document.querySelector('#comparison-position');
const baselineCaption = document.querySelector('#baseline-caption');
const referenceImage = document.querySelector('#compare-reference');
const baselineImage = document.querySelector('#compare-baseline');
const physirImage = document.querySelector('#compare-physir');

function updateComparison() {
  const frame = interpolationFrames[comparisonFrame.valueAsNumber];
  const name = `第 ${formatFrame(frame)} 帧`;
  const file = `${String(frame).padStart(5, '0')}.png`;
  const baselineName = baseline.selectedOptions[0].textContent;
  comparisonPosition.value = name;
  comparisonFrame.setAttribute('aria-valuetext', name);
  baselineCaption.textContent = baselineName;

  const panes = [
    { image: referenceImage, folder: 'reference', label: '真值' },
    { image: baselineImage, folder: baseline.value, label: baselineName },
    { image: physirImage, folder: 'physir', label: 'PhysIR 默认 TI' },
  ];

  for (const { image, folder, label } of panes) {
    const src = `./assets/compare/${folder}/${file}`;
    if (image.getAttribute('src') !== src) image.src = src;
    image.alt = `${name} · ${label}`;
  }
}

baseline.addEventListener('change', updateComparison);
comparisonFrame.addEventListener('input', updateComparison);
updateComparison();

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
