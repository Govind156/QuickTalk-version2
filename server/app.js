const express=require('express')
const app=express();
const cors=require('cors')
const authrouter=require('./controllers/authcontroller')
const userrouter=require('./controllers/usercontroller')
const chatrouter=require('./controllers/chatcontroller')
const messagerouter=require('./controllers/messagecontroller')
const server=require('http').createServer(app)
const io=require('socket.io')(server,{cors:{
    origin:'https://quicktalk-version2-client.onrender.com'
}})
// Import the message scheduler
const { initializeMessageScheduler } = require('./services/messagescheduler');


//middleware
app.use(cors())
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use(express.json({
    limit:"50mb"
}))
app.use('/api/auth',authrouter);
app.use('/api/user',userrouter);
app.use('/api/chat',chatrouter);
app.use('/api/message',messagerouter)




//let onlineUsers=[]
const onlineUsers=new Map()

//Track delivered message IDs to prevent duplicates
const deliveredMessages = new Set();

//test socket connection 
io.on('connection',socket=>{
    socket.on('join-room',userid=>{
        socket.join(userid)
    })
    
    socket.on('send-message',(message)=>{
        console.log(message)

        io.to(message.members[0]).to(message.members[1])
        .emit('receive-message',message)
        io.to(message.members[0]).to(message.members[1])
        .emit('set-message-count',message)
    })
    socket.on('clear-unread-message',(data)=>{
        io.to(data.members[0]).to(data.members[1])
        .emit('message-count-cleared',data)
    })

    socket.on('user-typing',(data)=>{
        io.to(data.members[0]).to(data.members[1])
        .emit('started-typing',data)
    })

    // socket.on('user-login', userId => {
    //     if(!onlineUsers.includes(userId)){
    //         onlineUsers.push(userId)
    //     }
    //     socket.emit('online-users', onlineUsers);
    // })
    // socket.on('user-login', userId => {
    //     if (!onlineUsers.includes(userId)) {
    //         onlineUsers.push(userId);
    //     }
    //     // Broadcast to all users that online users list has changed
    //     io.emit('online-users-updated', onlineUsers);
    // });
    socket.on('user-login', userId => {
        onlineUsers.set(userId, socket.id);
        io.emit('online-users-updated', Array.from(onlineUsers.keys()));
        console.log(`User ${userId} logged in`);
      });


    // socket.on('user-offline', userId => {
    //     onlineUsers.splice(onlineUsers.indexOf(userId), 1);
    //     io.emit('online-users-updated', onlineUsers);
    // })
    // socket.on('user-offline', userId => {
    //     onlineUsers = onlineUsers.filter(id => id !== userId);
    //     io.emit('online-users-updated', onlineUsers);
    // });
    socket.on('user-offline', userId => {
        if (onlineUsers.has(userId)) {
          onlineUsers.delete(userId);
          io.emit('online-users-updated', Array.from(onlineUsers.keys()));
          console.log(`User ${userId} logged out`);
        }
    });
    socket.on('disconnect', () => {
        // Find the user associated with this socket
        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            onlineUsers.delete(userId);
            io.emit('online-users-updated', Array.from(onlineUsers.keys()));
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
    });
    socket.on('scheduled-message-updated', (updatedMessage) => {
        // Verify the message structure
        if (!updatedMessage.chatId || !updatedMessage.members) {
            console.error('Invalid message structure for scheduled-message-updated');
            return;
        }

        // Broadcast to all chat members
        if (updatedMessage.members && Array.isArray(updatedMessage.members)) {
            updatedMessage.members.forEach(memberId => {
            io.to(memberId).emit('scheduled-message-updated', updatedMessage);
            });
        } else {
            console.error('No members array in scheduled message update');
        }
    });
    socket.on('receive-message', (message) => {
        if (message.members && Array.isArray(message.members)) {
          message.members.forEach(memberId => {
            io.to(memberId).emit('receive-message', message);
          });
        }
    });
    socket.on('user-deleted', (data) => {
        // Broadcast to all clients that a user was deleted
        io.emit('user-deleted', data);
    });
    // socket.on('mark-scheduled-read', (data) => {
    //     // Notify all members (especially the sender) that messages were read
    //     data.members.forEach(memberId => {
    //       io.to(memberId).emit('message-count-cleared', {
    //         chatId: data.chatId,
    //         readerId: data.readerId,
    //         readAt: new Date().toISOString()
    //       });
    //     });
    //   });
    // socket.on('send-scheduled-message', (message) => {
    //     if (!deliveredMessages.has(message.deliveryId)) {
    //       deliveredMessages.add(message.deliveryId);
          
    //       // Set expiration for tracking (1 hour)
    //       setTimeout(() => {
    //         deliveredMessages.delete(message.deliveryId);
    //       }, 3600000);
    
    //       io.to(message.members[0])
    //         .to(message.members[1])
    //         .emit('receive-schedule-message', message);
    //     }
    // });

});


// Initialize message scheduler
initializeMessageScheduler(io);

module.exports=server;

