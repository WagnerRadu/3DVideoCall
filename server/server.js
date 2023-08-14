import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const port = process.env.PORT || 8080;

const app = express();
app.use(express.static("public"));

const httpServer = createServer(app);
httpServer.listen(port);
console.log("Server is running on http://localhost:" + port);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173"]
    }
});

let usersMap = {}

io.on("connection", (socket) => {
    console.log(
        "User connected with ID:",
        socket.id + ". There are",
        io.engine.clientsCount,
        "users connected");

    usersMap[socket.id] = {};

    socket.emit("introduction", Object.keys(usersMap));

    io.emit("newUserConnected", socket.id);


    socket.on("signal", (to, from, data) => {
        if(to in usersMap) {
            io.to(to).emit("signal", to, from, data);
        } else {
            console.log("Peer with id", to, " was not found!");
        }
    });

    socket.on("disconnect", (reason) => {
    
        console.log("Server side socket with id:", socket.id, "disconnect for the reason:", reason);
        console.log("There are", io.engine.clientsCount, "users connected");
        io.emit("userDisconnected", (socket.id));
        delete usersMap[socket.id];
    })
});

