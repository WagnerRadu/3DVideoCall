import { Scene } from "./scene.js";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";

// import { processFace } from "./face-processor.js";
import global from 'global'
import * as process from "process";
// import * as tf from '@tensorflow/tfjs';
import { imgURI } from "./constants.js";

global.process = process;

let socket;

let scene;

let usersMap = {};

let clientStream;

let constraints = {
    audio: true,
    video: false
}

let faceTextureDataUri = null;

window.onload = run();

async function run() {
    faceTextureDataUri = localStorage.getItem("faceTexture");
    if (faceTextureDataUri) {
        console.log(faceTextureDataUri);
    } else {
        console.log("Could not receive the face texture. Please try again!");
    }
    
    clientStream = await navigator.mediaDevices.getUserMedia(constraints);
    init();
    scene = new Scene();
}

function init() {
    socket = io("http://localhost:8080");
    socket.on("connect", () => {
        console.log("My socket id:", socket.id);
    });

    socket.on("introduction", (userIdsList) => {
        scene.addUser(socket.id, faceTextureDataUri);
        userIdsList.forEach(theirSocketId => {
            if (theirSocketId != socket.id) {
                console.log("Adding user with id:", theirSocketId);
                usersMap[theirSocketId] = {};

                let pc = createPeerConnection(theirSocketId, true);
                usersMap[theirSocketId].peerConnection = pc;

                createAudioElement(theirSocketId);
            }
        });
    });

    socket.on("signal", (to, from, data) => {
        if (to != socket.id) {
            console.log("Socket IDs do not match!");
        }

        let peer = usersMap[from];
        if (peer.peerConnection) {
            peer.peerConnection.signal(data);
        } else {
            console.log("Never found right simplepeer object");

            let peerConnection = createPeerConnection(from, false);

            usersMap[from].peerConnection = peerConnection;

            peerConnection.signal(data);
        }
    });

    socket.on("newUserConnected", (theirSocketId) => {
        if (theirSocketId != socket.id && !(theirSocketId in usersMap)) {
            console.log("A new user connected with id:", theirSocketId);
            usersMap[theirSocketId] = {};
            createAudioElement(theirSocketId);
            // scene.addUser(theirSocketId);
        }
    });

    socket.on("userDisconnected", (disconnectedSocketId) => {
        console.log("User with ID:", disconnectedSocketId, "has disconnected");

        let audioEl = document.getElementById(disconnectedSocketId + "_audio");
        audioEl.remove();
        delete usersMap[disconnectedSocketId];
    });
}

function createPeerConnection(theirSocketId, isInitiator = false) {
    console.log('Connecting to peer with ID', theirSocketId);
    console.log('initiating?', isInitiator);

    let peerConnection = new SimplePeer({ initiator: isInitiator, trickle: true })

    peerConnection.on("signal", (data) => {
        socket.emit("signal", theirSocketId, socket.id, data);
    });

    peerConnection.on("connect", () => {
        console.log("Ready to send our stream!");

        let data = {
            message: "Hi, I am peer number " + socket.id + "!!!!!",
            faceTexture: faceTextureDataUri,
            socketId: socket.id
        };

        peerConnection.send(JSON.stringify(data));
        peerConnection.addStream(clientStream);
    });

    peerConnection.on("data", data => {
        data = JSON.parse(data);
        let message = data.message;
        console.log(message);

        let faceTexture = data.faceTexture;
        let theirSocketId = data.socketId;

        usersMap[theirSocketId].faceTexture = faceTexture;
        scene.addUser(theirSocketId, faceTexture); 
    });

    peerConnection.on("stream", stream => {
        console.log("Incoming stream");

        let audioStream = new MediaStream([stream.getAudioTracks()[0]]);

        let audioEl = document.getElementById(theirSocketId + "_audio");
        audioEl.srcObject = audioStream;
    })
    return peerConnection;
}

const createAudioElement = (id) => {
    let audioEl = document.createElement("audio");
    audioEl.setAttribute("id", id + "_audio");
    audioEl.controls = true;
    audioEl.volume = 1;
    let audioContainer = document.getElementById("audio-container")
    audioContainer.appendChild(audioEl);

    audioEl.addEventListener("loadeddata", () => {
        audioEl.play();
    });
}

const toggleMic = async () => {
    let audioTrack = clientStream.getTracks().find(track => track.kind === "audio");

    if(audioTrack.enabled) {
        audioTrack.enabled = false;
        console.log("Microphone muted");
        document.getElementById("mic-btn").style.backgroundColor = "rgb(150,150,150)";
    } else {
        audioTrack.enabled = true;
        console.log("Microphone unmuted");
        document.getElementById("mic-btn").style.backgroundColor = "rgb(179, 102, 249, 0.9)";
    }
}


document.getElementById("mic-btn").addEventListener("click", toggleMic);