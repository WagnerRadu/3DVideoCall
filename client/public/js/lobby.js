import { processFace } from "./face-processor.js";

const mediaConstraints = { video: true, audio: false };
const width = 320;
let height = 0;

let videoStream;
let video = document.getElementById("video");
let captureBtn = document.getElementById("capture-btn");
let joinBtn = document.getElementById("join-btn");
let generateBtn = document.getElementById("generate-btn");
let resultCanvas = document.getElementById("result-canvas");
let textureCanvas = document.getElementById("texture-canvas");
let streaming = false;

let imgDataUri = null;
let textureDataUri = null;

init();

async function init() {
  videoStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

  try {
    video.srcObject = videoStream;
    video.play();
  } catch (e) {
    console.log("Could not get the video input!");
    console.error(e);
  }
}

video.addEventListener(
  "canplay",
  () => {
    if (!streaming) {
      height = (video.videoHeight / video.videoWidth) * width;

      video.setAttribute("width", width);
      video.setAttribute("height", height);
      resultCanvas.setAttribute("width", width);
      resultCanvas.setAttribute("height", height);
      streaming = true;
    }
  },
  false,
);

joinBtn.addEventListener("click", () => {
  if (textureDataUri != null) {
    console.log("Joining call");
    localStorage.setItem("faceTexture", textureDataUri);
    window.location = `index.html`;
  }
});

captureBtn.addEventListener("click", (ev) => {
  ev.preventDefault();

  let context = resultCanvas.getContext("2d");
  if (width && height) {
    resultCanvas.width = width;
    resultCanvas.height = width;

    let faceArea = video.videoHeight / 2;
    let pX = video.videoWidth / 2 - faceArea / 2;
    let pY = video.videoHeight / 2 - faceArea / 2;

    context.drawImage(video, pX, pY, faceArea, faceArea, 0, 0, resultCanvas.width, resultCanvas.height);

    imgDataUri = resultCanvas.toDataURL("image/jpeg");
  } else {
    clearphoto();
  }
});

generateBtn.addEventListener("click", async (ev) => {
  ev.preventDefault();

  if (imgDataUri != null) {
    textureDataUri = await processFace(imgDataUri);
    let context = textureCanvas.getContext("2d");

    if (width && height) {
      textureCanvas.width = width;
      textureCanvas.height = width;
      // context.drawImage(video, 0, 0, textureCanvas.width, textureCanvas.height);
      let img = new Image;
      img.onload = function () {
        context.drawImage(img, 0, 0, textureCanvas.width, textureCanvas.height); // Or at whatever offset you like
      };
      img.src = textureDataUri;
    }
  }
});

function clearphoto() {
  let context = resultCanvas.getContext("2d");
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

  let data = resultCanvas.toDataURL("image/jpeg");
  photo.setAttribute("src", data);
}


function drawImage() {
  // let video = document.querySelector("#webCamera");
  let canvas = document.querySelector("#videoCanvas");
  let ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;


  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // let faceArea = 150;
  let faceArea = canvas.height / 2;
  let pX = canvas.width / 2 - faceArea / 2;
  let pY = canvas.height / 2 - faceArea / 2;

  ctx.rect(pX, pY, faceArea, faceArea);
  ctx.lineWidth = "6";
  ctx.strokeStyle = "red";
  ctx.stroke();


  setTimeout(drawImage, 100);
}

video.onplay = function () {
  setTimeout(drawImage, 300);
};