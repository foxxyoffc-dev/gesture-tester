import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";

/* ELEMENT */

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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
    Math.random() * canvas.width;

    this.y =
    Math.random() * canvas.height;

    this.tx = x;
    this.ty = y;

    this.size =
    Math.random() * 2 + 1;
  }

  update(){

    this.x +=
    (this.tx - this.x) * 0.08;

    this.y +=
    (this.ty - this.y) * 0.08;
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
      Math.PI * 2
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
      (y * temp.width + x) * 4;

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

    fakeGestureLoop();

  }catch(err){

    console.log(err);

    statusText.innerText =
    "Camera Access Denied";

  }

}

/* DEMO GESTURE LOOP */

function fakeGestureLoop(){

  const gestures = [
    "peace",
    "heart",
    "shaka"
  ];

  let index = 0;

  setInterval(()=>{

    const gesture =
    gestures[index];

    generateTextParticles(
      customMap[gesture]
    );

    statusText.innerText =
    `Gesture Detected : ${gesture}`;

    index++;

    if(index >= gestures.length){
      index = 0;
    }

  },3000);

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
