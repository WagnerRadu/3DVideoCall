import { Scene } from "./scene.js";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080")

socket.on("connect", () => {
    console.log("My socket id:", socket.id);
})

const scene = new Scene();
