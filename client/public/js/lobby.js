import { processFace } from "./face-processor.js";
import localforage, * as localForage from "localforage";
import * as THREE from "three";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js"

let videoStream;
let video = document.getElementById("video");
let captureBtn = document.getElementById("capture-btn");
let joinBtn = document.getElementById("join-btn");
let generateBtn = document.getElementById("generate-btn");
let videoCanvas = document.getElementById("video-canvas");
let resultCanvas = document.getElementById("result-canvas");
let textureCanvas = document.getElementById("texture-canvas");
// let streaming = false;

const mediaConstraints = { video: true, audio: false };
const width = 320;
const height = 240;

let imgDataUri = null;
let textureDataUri = null;

window.onload = init();

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

// video.addEventListener(
//   "canplay",
//   () => {
//     if (!streaming) {
//       height = (video.videoHeight / video.videoWidth) * width;

//       video.setAttribute("width", width);
//       video.setAttribute("height", height);
//       resultCanvas.setAttribute("width", width);
//       resultCanvas.setAttribute("height", height);
//       streaming = true;
//     }
//   },
//   false,
// );

joinBtn.addEventListener("click", () => {
  if (textureDataUri != null) {
    console.log("Joining call");
    localforage.setItem("faceTexture", textureDataUri).then(() => { window.location = `index.html` });
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
    // let context = textureCanvas.getContext("2d");

    // if (width && height) {
      textureCanvas.width = width;
      textureCanvas.height = width;
      // context.drawImage(video, 0, 0, textureCanvas.width, textureCanvas.height);
      // let img = new Image;
      // img.onload = function () {
      //   context.drawImage(img, 0, 0, textureCanvas.width, textureCanvas.height); // Or at whatever offset you like
      // };
      // img.src = textureDataUri;
    // }
    drawModel(textureDataUri);
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
  let ctx = videoCanvas.getContext('2d');

  videoCanvas.width = width;
  videoCanvas.height = height;

  ctx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);

  let faceArea = videoCanvas.height / 2;
  let pX = videoCanvas.width / 2 - faceArea / 2;
  let pY = videoCanvas.height / 2 - faceArea / 2;

  ctx.rect(pX, pY, faceArea, faceArea);
  ctx.lineWidth = "6";
  ctx.strokeStyle = "red";
  ctx.stroke();

  setTimeout(drawImage, 100);
}

video.onplay = function () {
  setTimeout(drawImage, 300);
};

function drawModel(faceTexture) {
  console.log("Drawing model with face texture:");
  console.log(faceTexture);
  const gltfLoader = new GLTFLoader();

  // this.width = parent.innerWidth;
  // this.height = parent.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / width, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    canvas: textureCanvas,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, width);
  camera.position.setZ(3);
  camera.lookAt(0, 0, 0);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(0, 0, 3);

  const hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 2);
  scene.add(mainLight, hemisphereLight);

  // renderer.setClearColor(0xFFFFDD);
  scene.add(new THREE.AxesHelper(100));

  gltfLoader.load("../assets/human_bust.gltf", (gltfScene) => {
    const model = gltfScene.scene.children[0];
    const mixer = new THREE.AnimationMixer(model);
    // this.users3DObjects[id].mixer = mixer;
    const animation = gltfScene.animations[0];
    const action = mixer.clipAction(animation);
    action.setDuration(1);
    action.play();
    // console.log(gltfScene);

    gltfScene.scene.traverse(function (child) {

      if (child.material && child.material.name === "Skin") {
        console.log("Changing skin material");
        if (faceTexture) {
          const texture = new THREE.TextureLoader().load(faceTexture);

          texture.flipY = false;
          child.material.map = texture;
          child.material.roughness = 1;
        }
      }
      if (child.material && child.material.name === "Mouth") {
        child.material.color.set(0xfc0303);
      }
      if (child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
    model.position.set(0, -4.5, 0);
    console.log(model);
    scene.add(model);
  });

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}