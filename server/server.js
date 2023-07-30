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

let peerList = {}

io.on("connection", (socket) => {
    console.log(
        "User connected with ID:", 
        socket.id + ". There are",
        io.engine.clientsCount,
        "users connected");
    
    peerList[socket.id]
  });
  
