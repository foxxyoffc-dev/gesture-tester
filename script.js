import {
  HandLandmarker,
  FilesetResolver
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');

canvas.width = innerWidth;
canvas.height = innerHeight;

let particles = [];
let currentMode = 'idle';

const customMap = {
  peace: 'foxxy ❤ uwaw',
  heart: '❤',
  shaka: 'created by foxxy official'
};

class Particle {
  constructor(x, y) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.tx = x;
    this.ty = y;

    this.size = Math.random() * 2 + 1;
    this.speed = 0.14;
  }

  update() {
    this.x += (this.tx - this.x) * this.speed;
    this.y += (this.ty - this.y) * this.speed;
  }

  draw() {
    const hue = (Date.now() / 8 + this.x * 0.05) % 360;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

    ctx.fillStyle = `hsl(${hue},100%,70%)`;
    ctx.shadowColor = `hsl(${hue},100%,70%)`;
    ctx.shadowBlur = 15;

    ctx.fill();
  }
}

function idleParticles() {
  particles = [];

  for (let i = 0; i < 180; i++) {
    const p = new Particle(
      Math.random() * canvas.width,
      Math.random() * canvas.height
    );

    p.tx = Math.random() * canvas.width;
    p.ty = Math.random() * canvas.height;

    particles.push(p);
  }
}

function generateTextParticles(text) {
  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d');

  temp.width = canvas.width;
  temp.height = canvas.height;

  tctx.fillStyle = 'white';
  tctx.textAlign = 'center';
  tctx.font = 'bold 90px Arial';

  tctx.fillText(
    text,
    canvas.width / 2,
    canvas.height / 2
  );

  const data = tctx.getImageData(
    0,
    0,
    temp.width,
    temp.height
  ).data;

  particles = [];

  for (let y = 0; y < temp.height; y += 5) {
    for (let x = 0; x < temp.width; x += 5) {

      const index = (y * temp.width + x) * 4;

      if (data[index + 3] > 128) {
        particles.push(new Particle(x, y));
      }
    }
  }
}

function generateHeart() {
  particles = [];

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (let t = 0; t < Math.PI * 2; t += 0.025) {

    const x =
      16 * Math.pow(Math.sin(t), 3);

    const y =
      13 * Math.cos(t)
      - 5 * Math.cos(2 * t)
      - 2 * Math.cos(3 * t)
      - Math.cos(4 * t);

    particles.push(
      new Particle(
        cx + x * 20,
        cy - y * 20
      )
    );
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  if (currentMode === 'idle') {

    particles.forEach(p => {

      p.tx += Math.sin(
        Date.now() * 0.001 + p.x
      ) * 0.8;

      p.ty += Math.cos(
        Date.now() * 0.001 + p.y
      ) * 0.8;

    });

  }

  requestAnimationFrame(animate);
}

animate();
idleParticles();

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function isPeace(l) {
  return (
    l[8].y < l[6].y &&
    l[12].y < l[10].y &&
    l[16].y > l[14].y &&
    l[20].y > l[18].y
  );
}

function isShaka(l) {
  return (
    l[4].x < l[3].x &&
    l[20].y < l[18].y &&
    l[8].y > l[6].y
  );
}

function isFingerHeart(l) {
  return distance(l[4], l[8]) < 0.05;
}

async function setupCamera() {

  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user'
      },
      audio: false
    });

  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function init() {

  await setupCamera();

  statusText.innerText = 'Camera Ready';

  const vision =
    await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );

  const handLandmarker =
    await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
        },

        runningMode: 'VIDEO',
        numHands: 1
      }
    );

  async function detect() {

    const result =
      handLandmarker.detectForVideo(
        video,
        performance.now()
      );

    if (result.landmarks.length > 0) {

      const l = result.landmarks[0];

      if (isPeace(l)) {

        if (currentMode !== 'peace') {

          currentMode = 'peace';

          statusText.innerText =
            '✌ Peace Detected';

          generateTextParticles(
            customMap.peace
          );
        }

      }

      else if (isFingerHeart(l)) {

        if (currentMode !== 'heart') {

          currentMode = 'heart';

          statusText.innerText =
            '🫰 Heart Detected';

          if (customMap.heart === '❤') {
            generateHeart();
          } else {
            generateTextParticles(
              customMap.heart
            );
          }

        }

      }

      else if (isShaka(l)) {

        if (currentMode !== 'shaka') {

          currentMode = 'shaka';

          statusText.innerText =
            '🤙 Shaka Detected';

          generateTextParticles(
            customMap.shaka
          );
        }

      }

      else {

        currentMode = 'idle';

        statusText.innerText =
          'Waiting Gesture...';

      }

    }

    else {

      currentMode = 'idle';

    }

    requestAnimationFrame(detect);
  }

  detect();
}

document.getElementById('enterBtn').onclick = () => {

  document.getElementById(
    'landing'
  ).style.opacity = '0';

  setTimeout(() => {

    document.getElementById(
      'landing'
    ).style.display = 'none';

  }, 900);

  init();
};

document.getElementById('supportBtn').onclick = () => {

  const box =
    document.getElementById(
      'supportLinks'
    );

  box.style.display =
    box.style.display === 'flex'
      ? 'none'
      : 'flex';
};

document.getElementById('saveCustom').onclick = () => {

  const gesture =
    document.getElementById(
      'gestureSelect'
    ).value;

  const text =
    document.getElementById(
      'customText'
    ).value;

  if (text) {

    customMap[gesture] = text;

    alert('Custom saved');

  }
};

window.addEventListener('resize', () => {

  canvas.width = innerWidth;
  canvas.height = innerHeight;

});
