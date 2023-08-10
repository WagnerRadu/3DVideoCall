import { Scene } from "./scene.js";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";

import global from 'global'
import * as process from "process";

global.process = process;

const socket = io("http://localhost:8080");

let usersMap = {};

socket.on("connect", () => {
    console.log("My socket id:", socket.id);
});

socket.on("introduction", (userIdsList) => {
    userIdsList.forEach(otherId => {
        if (otherId != socket.id) {
            console.log("Adding user with id:", otherId);
            usersMap[otherId] = {};

            let pc = createPeerConnection(otherId, true);
            usersMap[otherId].peerConnection = pc;
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
    }


});

function createPeerConnection(theirSocketId, isInitiator = false) {
    console.log('Connecting to peer with ID', theirSocketId);
    console.log('initiating?', isInitiator);

    let peerConnection = new SimplePeer({ initiator: isInitiator })

    peerConnection.on("signal", (data) => {
        socket.emit("signal", theirSocketId, socket.id, data);
    });

    peerConnection.on("connect", () => {
        console.log("Ready to send our stream!");
        peerConnection.send("Hi, I am peer number " + socket.id + "!!!!!");
    })

    peerConnection.on("data", data => {
        console.log(data.toString());
    });

    return peerConnection;
}

const scene = new Scene();


