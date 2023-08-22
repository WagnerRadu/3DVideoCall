const mediaConstraints = {video: true, audio: false};
const width = 320;   
const height = 0;  

let videoStream;
let video = document.getElementById("video");
let captureBtn = document.getElementById("capture-btn");
let streaming = false;

async function init() {
    videoStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

    try {
        video.srcObject = videoStream;
        video.play();
    } catch(e) {
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

captureBtn.addEventListener("click", () => {
    ev.preventDefault();
    takepi

})