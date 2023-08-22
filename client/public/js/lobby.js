const mediaConstraints = { video: true, audio: false };
const width = 320;
let height = 0;

let videoStream;
let video = document.getElementById("video");
let captureBtn = document.getElementById("capture-btn");
let canvas = document.getElementById("canvas");
let streaming = false;

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
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);
      streaming = true;
    }
  },
  false,
);

let joinBtn = document.getElementById("join-btn");

joinBtn.addEventListener("click", () => {
  console.log("Joining call");
  window.location = `index.html`;
});

captureBtn.addEventListener("click", (ev) => {
  ev.preventDefault();

  let context = canvas.getContext("2d");
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    let data = canvas.toDataURL("image/jpeg");
  } else {
    clearphoto();
  }});

  function clearphoto() {
    let context = canvas.getContext("2d");
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    let data = canvas.toDataURL("image/jpeg");
    photo.setAttribute("src", data);
  }