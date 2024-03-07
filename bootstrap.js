const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const System = require("./src/utils/system");
const router = require("./src/routes/userRoute");
const app = express();
const socket = require("socket.io");

require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use("/api/auth", router);

const server = app.listen(process.env.PORT, () => {
  System.logo("Voyage");
  System.vice(`🚀 🚀 🚀 Server is running on port ${process.env.HOST}:${process.env.PORT}  ✨`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    System.error(`Port ${process.env.PORT} is already in use`);
    process.exit(1);
  }
});

const io = socket(server, {
  cors: {
    origin: process.env.CLIENT,
    Credential: true,
  },
});

global.onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("chat", (userId, msg) => {
    onlineUsers[userId] = socket.id;
    console.log("socketid:", socket.id);
    console.log("users:", onlineUsers);
    console.log("msg:", msg);
  });
  // 用户发送消息事件
  socket.on("send message", (data) => {
    const { receiverId, content } = data;
    const receiverSocketId = users[receiverId]; // 根据接收者ID获取Socket ID

    if (receiverSocketId) {
      // 如果接收者在线，则直接发送消息给接收者
      io.to(receiverSocketId).emit("receive message", { senderId: socket.id, content });
    } else {
      // 如果接收者离线，可以将消息存储到数据库（此处省略数据库操作）
      console.log(`Message for ${receiverId} stored as offline, as they are not online.`);
    }
  });

  // 用户断开连接时
  socket.on("disconnect", () => {
    // const userId = Object.keys(users).find((key) => users[key] === socket.id);
    // if (userId) {
    //   delete users[userId]; // 从映射中移除用户
    //   console.log(`${userId} disconnected`);
    // }

    // 发送当前在线用户列表给所有用户（可选）
    // io.emit("online users", Object.keys(users));
  });
  socket.on("chat-group", () => {});
});

mongoose
  .connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    System.success(`mongoDB connected successfully on ${process.env.MONGO_URI}🍃`);
  })
  .catch((err) => {
    System.error(err.message);
  });
mongoose.set("debug", true);
