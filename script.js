import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";

/* ELEMENT */

const video =
document.getElementById("video");

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const statusText =
document.getElementById("status");

/* SIZE */

canvas.width = innerWidth;
canvas.height = innerHeight;

/* PARTICLES */

let particles = [];

class Particle{

  constructor(x,y){

    this.x =
    Math.random()*canvas.width;

    this.y =
    Math.random()*canvas.height;

    this.tx = x;
    this.ty = y;

    this.size =
    Math.random()*2+1;
  }

  update(){

    this.x +=
    (this.tx-this.x)*0.08;

    this.y +=
    (this.ty-this.y)*0.08;
  }

  draw(){

    const hue =
    (Date.now()/10 + this.x*0.05)%360;

    ctx.beginPath();

    ctx.arc(
      this.x,
      this.y,
      this.size,
      0,
      Math.PI*2
    );

    ctx.fillStyle =
    `hsl(${hue},100%,70%)`;

    ctx.shadowColor =
    `hsl(${hue},100%,70%)`;

    ctx.shadowBlur = 15;

    ctx.fill();
  }

}

/* IDLE */

function idleParticles(){

  particles = [];

  for(let i=0;i<250;i++){

    const p =
    new Particle(
      Math.random()*canvas.width,
      Math.random()*canvas.height
    );

    p.tx =
    Math.random()*canvas.width;

    p.ty =
    Math.random()*canvas.height;

    particles.push(p);
  }

}

idleParticles();

/* TEXT PARTICLES */

function generateTextParticles(text){

  const temp =
  document.createElement("canvas");

  const tctx =
  temp.getContext("2d");

  temp.width = canvas.width;
  temp.height = canvas.height;

  tctx.clearRect(
    0,
    0,
    temp.width,
    temp.height
  );

  tctx.fillStyle = "white";

  tctx.textAlign = "center";

  tctx.font =
  "bold 90px Arial";

  tctx.fillText(
    text,
    canvas.width/2,
    canvas.height/2
  );

  const data =
  tctx.getImageData(
    0,
    0,
    temp.width,
    temp.height
  ).data;

  particles = [];

  for(let y=0;y<temp.height;y+=5){

    for(let x=0;x<temp.width;x+=5){

      const index =
      (y*temp.width+x)*4;

      if(data[index+3] > 128){

        particles.push(
          new Particle(x,y)
        );

      }

    }

  }

}

/* ANIMATION */

function animate(){

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  particles.forEach(p=>{

    p.update();
    p.draw();

  });

  requestAnimationFrame(animate);

}

animate();

/* CUSTOM */

const customMap = {

  peace:"foxxy ❤ uwaw",
  heart:"❤",
  shaka:"created by foxxy official"

};

document
.getElementById("saveCustom")
.onclick = ()=>{

  const gesture =
  document.getElementById(
    "gestureSelect"
  ).value;

  const text =
  document.getElementById(
    "customText"
  ).value;

  if(text.trim()){

    customMap[gesture] = text;

    statusText.innerText =
    "Custom Saved ✔";

  }

};

/* BUTTON */

document
.getElementById("enterBtn")
.onclick = ()=>{

  document
  .getElementById("landing")
  .style.display = "none";

  initCamera();

};

document
.getElementById("supportBtn")
.onclick = ()=>{

  const box =
  document.getElementById(
    "supportLinks"
  );

  box.style.display =
  box.style.display === "flex"
  ? "none"
  : "flex";

};

/* CAMERA */

async function initCamera(){

  try{

    const stream =
    await navigator.mediaDevices
    .getUserMedia({
      video:true
    });

    video.srcObject = stream;

    statusText.innerText =
    "Camera Ready";

    startHandTracking();

  }catch(err){

    console.log(err);

    statusText.innerText =
    "Camera Access Denied";

  }

}

/* HAND TRACKING */

async function startHandTracking(){

  const vision =
  await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  const handLandmarker =
  await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions:{
        modelAssetPath:
        "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task"
      },

      runningMode:"VIDEO",

      numHands:1
    }
  );

  async function detect(){

    const results =
    handLandmarker.detectForVideo(
      video,
      performance.now()
    );

    if(results.landmarks.length > 0){

      const lm =
      results.landmarks[0];

      detectGesture(lm);

      drawLandmarks(lm);

    }

    requestAnimationFrame(detect);

  }

  detect();

}

/* DRAW HAND */

function drawLandmarks(lm){

  ctx.strokeStyle =
  "rgba(0,255,255,0.7)";

  ctx.lineWidth = 2;

  lm.forEach(point=>{

    ctx.beginPath();

    ctx.arc(
      point.x * canvas.width,
      point.y * canvas.height,
      5,
      0,
      Math.PI*2
    );

    ctx.fillStyle =
    "#00e5ff";

    ctx.fill();

  });

}

/* GESTURE */

let lastGesture = "";

function detectGesture(lm){

  const thumbTip = lm[4];

  const indexTip = lm[8];

  const middleTip = lm[12];

  const ringTip = lm[16];

  const pinkyTip = lm[20];

  /* PEACE */

  const peace =
  indexTip.y < lm[6].y &&
  middleTip.y < lm[10].y &&
  ringTip.y > lm[14].y &&
  pinkyTip.y > lm[18].y;

  /* SHAKA */

  const shaka =
  thumbTip.x < lm[3].x &&
  pinkyTip.y < lm[18].y &&
  indexTip.y > lm[6].y;

  /* HEART */

  const heart =
  Math.abs(
    thumbTip.x - indexTip.x
  ) < 0.05;

  if(peace && lastGesture !== "peace"){

    lastGesture = "peace";

    generateTextParticles(
      customMap.peace
    );

    statusText.innerText =
    "✌ Peace Detected";

  }

  else if(
    shaka &&
    lastGesture !== "shaka"
  ){

    lastGesture = "shaka";

    generateTextParticles(
      customMap.shaka
    );

    statusText.innerText =
    "🤙 Shaka Detected";

  }

  else if(
    heart &&
    lastGesture !== "heart"
  ){

    lastGesture = "heart";

    generateTextParticles(
      customMap.heart
    );

    statusText.innerText =
    "🫰 Heart Detected";

  }

}

/* RESIZE */

window.addEventListener(
  "resize",
  ()=>{

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    idleParticles();

  }
);
