require('dotenv').config();
var dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app); 
const io = socketIO(server);



const pub = new Redis({
    host: "redis-2fc0b070-apurvathakur677-3ba3.a.aivencloud.com",
    port: "12861",
    username: "default",
    password: "AVNS_W8tLxOHXund_zL3XRC4",
});

const sub = new Redis({
    host: "redis-2fc0b070-apurvathakur677-3ba3.a.aivencloud.com",
    port: "12861",
    username: "default",
    password: "AVNS_W8tLxOHXund_zL3XRC4",
});
// Redis Subscription for chat messages
/*sub.subscribe("MESSAGES");
sub.on('message', (channel, data) => {
    if (channel === "MESSAGES") {
        io.emit('data', JSON.parse(data));
    }
});*/

// Redis Subscription for User Status
sub.subscribe('USER_STATUS');
sub.on('message', (channel, data) => {
    if (channel === 'USER_STATUS') {
        io.emit('userStatusChange', JSON.parse(data));
    }
});

const User = require('./models/userModel');
const Chat = require('./models/chatModel');

const redis = require('redis');



const userNamespace = io.of('/user-namespace');

//Handles events related to user-specific communication,
// such as connection, disconnection, and chat messages.
userNamespace.on('connection', async function(socket) {
    console.log('User Connected');

    var userId = socket.handshake.auth.token;
    sub.subscribe('MESSAGES');
    sub.on('messages', (channel, data) => {
        if (channel === 'MESSAGES') {
            console.log('New message from Redis:', JSON.parse(data));
            socket.emit('newMessage', JSON.parse(data));
        }
    });

    // Subscribe to a user-specific channel for user-related events
    sub.subscribe(`USER_STATUS:${userId}`);
    sub.on('message', (channel, data) => {
        if (channel === `USER_STATUS:${userId}`) {
            socket.emit('userStatusChange', JSON.parse(data));
        }
    });
    
    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '1' } });
    socket.broadcast.emit('getOnlineUser', { user_id: userId });

    //publishing user online status to Redis channel
    await pub.publish('USER_STATUS', JSON.stringify({ userId, status: 'online' }));
    
    // Handling Redis Subscription for User Status
    // sub.subscribe(`USER_STATUS:${userId}`);
    // sub.on('message', (channel, data) => {
    //     if (channel === `USER_STATUS:${userId}`) {
    //         socket.emit('userStatusChange', JSON.parse(data));
    //     }
    // });
    
    socket.on('chatMessage', async function(data) {
        console.log('Received chatMessage event:', data);
        userNamespace.emit('newChatMessage', {
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            message: data.message,
            type: data.type
        
        });
        // Publish chat message to Redis channel
        await pub.publish('MESSAGES', JSON.stringify(data));
        
        try {
            var chat = new Chat({
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                message: data.message,
                type: data.type
            });

            var newChat = await chat.save();
            console.log('Saved Chat:', newChat);
        } catch (error) {
            console.error('Error saving chat:', error);
            
            socket.emit('saveChatError', { error: 'Error saving chat' });
        }
    });

    socket.on('disconnect', async function() {
        console.log('User Disconnected');

        var userId = socket.handshake.auth.token;

        await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '0' } });
        socket.broadcast.emit('getOfflineUser', { user_id: userId });
        // Publish user offline status to Redis channel
        await pub.publish('USER_STATUS', JSON.stringify({ userId, status: 'offline' }));
    });

    //new
    socket.on('existsChat', async function(data) {
        try {
            console.log('existsChat event received:', data);

            var chats = await Chat.find({
                $or: [
                    { sender_id: data.sender_id, receiver_id: data.receiver_id },
                    { sender_id: data.receiver_id, receiver_id: data.sender_id },
                ]
            });

            console.log('Chats:', chats);

            socket.emit('loadChats', { chats: chats });
        } catch (error) {
            console.error("Error loading chats:", error);
            
            socket.emit('loadChatsError', { error: 'Error loading chats' });
        }
    });


    socket.on('joinGroup', function (data) {
        
        console.log(data.group_name+"hhhh");
        const room = data.group_name;

        socket.join(room);
        socket.emit('groupJoined', { group_name: data.group_name });
    });
});



const groupNamespace = io.of('/group-namespace');

groupNamespace.on('connection', async function(socket) {
    console.log('User Connected to Group Chat');

    socket.on('joinGroupChat', function(data) {
        
        const room = data.groupName;
        socket.join(room);
        console.log(`User joined Group Chat: ${room}`);
    });

    socket.on('sendGroupChatMessage', function(data) {
        const room = data.groupName;
        groupNamespace.to(room).emit('groupChatMessage', {
            sender: socket.handshake.auth.token,
            message: data.message
        });
    });
});




mongoose.connect('mongodb://127.0.0.1:27017/chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

const userRoute = require('./routes/userRoutes.js');
app.use('/', userRoute);
dotenv.config({
    path: "./config.env"
})
const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
