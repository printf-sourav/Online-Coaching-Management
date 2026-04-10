
import connectDB from "./db/index.js";
import { app } from "./app.js";
import {createServer} from "http"
import { Server } from "socket.io";
import initSocket from "./sockets/index.js";
import { startScheduler } from "./utils/scheduler.js";


connectDB()
.then(()=>{
    const httpServer = createServer(app);
    const io = new Server(httpServer,{
        cors:{
            origin:process.env.CLIENT_URL,
            credentials:true
        }
    })

    initSocket(io)

    app.set("io",io)
    global.io=io
    httpServer.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on port: ${process.env.PORT || 5000}`);
        startScheduler();
    });
})
.catch((err)=>{ 
    console.log("MONGODB connection failed ??? ",err)
})