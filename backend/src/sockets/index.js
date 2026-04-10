export default function initSocket(io) {

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // 🔹 Join user room
        socket.on("joinUser", (userId) => {
            socket.join(`user:${userId}`);
            console.log(`Joined room user:${userId}`);
        });

        // 🔹 Join class room
        socket.on("joinClass", (classId) => {
            socket.join(`class:${classId}`);
            console.log(`Joined room class:${classId}`);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

}