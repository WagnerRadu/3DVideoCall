import { Scene } from "./scene.js";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";
import { arrayBufferToString, concatUint8Arrays, stringToArrayBuffer } from "./utils.js";
import localforage, * as localForage from "localforage";


let socket;

let scene;

let usersMap = {};

let clientStream;

let constraints = {
    audio: true,
    video: false
}

let faceTextureDataUri = null;

const audioCtx = new AudioContext();

window.onload = run();

async function run() {
    faceTextureDataUri =  await localforage.getItem("faceTexture");
    localforage.removeItem("faceTexture").then(console.log("Cleared face texture from local storage"));

    if (faceTextureDataUri) {
        console.log(faceTextureDataUri);
    } else {
        console.log("Could not receive the face texture. Please try again!");
        window.location = `lobby.html`;
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
        }
    });

    socket.on("userDisconnected", (disconnectedSocketId) => {
        console.log("User with ID:", disconnectedSocketId, "has disconnected");

        let audioEl = document.getElementById(disconnectedSocketId + "_audio");
        audioEl.remove();
        scene.removeUser(disconnectedSocketId);
        usersMap[disconnectedSocketId].peerConnection.destroy();
        clearInterval(usersMap[disconnectedSocketId].animationIntervalId);
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
            faceTexture: faceTextureDataUri,
        };
        let json = JSON.stringify(data);
        let enc = new TextEncoder();
        let arrayBuf = enc.encode(json);

        const chunkSize = 16 * 1024;

        while (arrayBuf.byteLength) {
            const chunk = arrayBuf.slice(0, chunkSize);
            arrayBuf = arrayBuf.slice(chunkSize, arrayBuf.byteLength);

            peerConnection.send(chunk);
        }

        peerConnection.send("Done!");
        peerConnection.addStream(clientStream);
    });

    const fileChunks = [];
    peerConnection.on("data", data => {
        if (data.toString() === 'Done!') {
            let mergedArray = concatUint8Arrays(fileChunks);

            // let json = arrayBufferToString(mergedArray);
            let json = new TextDecoder().decode(mergedArray);

            data = JSON.parse(json);
            // console.log(data.message);

            let faceTexture = data.faceTexture;
            console.log("Received data from user with id", theirSocketId);

            usersMap[theirSocketId].faceTexture = faceTexture;
            scene.addUser(theirSocketId, faceTexture);
        }
        else {
            fileChunks.push(data);
        }
    });

    
    peerConnection.on("stream", stream => {
        console.log("Incoming stream");

        let audioStream = new MediaStream([stream.getAudioTracks()[0]]);
        console.log("Audio stream received:", audioStream);

        let audioEl = document.getElementById(theirSocketId + "_audio");
        audioEl.srcObject = audioStream;

        const audioStreamSourceNode = audioCtx.createMediaStreamSource(audioStream.clone());
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        audioStreamSourceNode.connect(analyser);

        usersMap[theirSocketId].animationIntervalId = setInterval(() => {

            let bufferLengthAlt = analyser.frequencyBinCount;
            let dataArrayAlt = new Uint8Array(bufferLengthAlt)
            
            let sumAmplitude = 0;
            analyser.getByteFrequencyData(dataArrayAlt);
            for (const amplitude of dataArrayAlt) {
                sumAmplitude += amplitude;
            }
            // console.log(theirSocketId, ":", sumAmplitude);
            scene.moveMouth(theirSocketId, sumAmplitude);
        }, 50)
        console.log("Started interval with id:",  usersMap[theirSocketId].animationIntervalId);
    })

    peerConnection.on("close", () => {
        console.log("Peer connection close by user", theirSocketId);
    })

    return peerConnection;
}

const createAudioElement = (id) => {
    let audioEl = document.createElement("audio");
    audioEl.setAttribute("id", id + "_audio");
    audioEl.controls = true;
    audioEl.volume = 1;
    audioEl.style.display = "none";

    let audioContainer = document.getElementById("audio-container")
    audioContainer.appendChild(audioEl);

    audioEl.addEventListener("loadeddata", () => {
        audioEl.play();
    });
}

const toggleMic = async () => {
    let audioTrack = clientStream.getAudioTracks()[0];

    if (audioTrack.enabled) {
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

document.getElementById("leave-btn").addEventListener("click", () => {
    window.location = `lobby.html`;
});

document.getElementById("reset-btn").addEventListener("click", () => {
    scene.changePerspective();
});