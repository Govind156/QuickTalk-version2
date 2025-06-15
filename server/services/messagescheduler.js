const cron = require('node-cron');
const Message = require('../models/messagemodel');
const Chat = require('../models/chatmodel');
const initializeMessageScheduler = (io) => {
  cron.schedule('* * * * *', async () => {
    try {
      const currentTime = new Date();   
      const messagesToSend = await Message.find({
        scheduled: true,
        sent: false,
        scheduledFor: { $lte: currentTime }
      }).populate({
        path: "chatId",
        populate: {
          path: "members",
          select: "_id"
        }
      });
      for (const message of messagesToSend) {
        try {
          // Skip if already sent (race condition protection)
          if (message.sent) continue;

          // Mark as sent first to prevent duplicate processing
          message.sent = true;
          message.scheduled = false;
          await message.save();

          // Get member IDs
          const memberIds = message.chatId.members.map(m => m._id.toString());

         // Create unique delivery ID
          const deliveryId = `sched-${message._id}-${Date.now()}`;
          
          // Prepare the message object to emit
          const messageToEmit = {
            ...message.toObject(),
            _id: message._id.toString(), // Ensure _id is string
            chatId: message.chatId._id.toString(),
            members: memberIds,
            deliveryId,
            read: false,
            createdAt: new Date(),
            // Explicitly set these flags
            scheduled: false,
            sent: true,
            isScheduled: true , // Flag to identify scheduled messages
            originalSender: message.sender.toString()
          };
          

  
          // 2. For removing from scheduled list
          io.to(message.chatId._id.toString()).emit('scheduled-message-sent', {
            ...messageToEmit
          });



          // Emit to members for adding to regular chat
          memberIds.forEach(memberId => {
            io.to(memberId).emit('schedule-receive-message', messageToEmit);
          });

          // Update chat's last message
          await Chat.findByIdAndUpdate(message.chatId._id, { 
            lastMessage: message._id,
            $inc: { unreadMessageCount: 1 }
          });

          const messageForCount = {
            _id: message._id.toString(),
            chatId: message.chatId._id.toString(),
            sender: message.sender.toString(),
            members: memberIds,
            text: message.text,
            createdAt: new Date(),
          };
          
          // Emit to update unread counts
          io.emit('set-message-count', messageToEmit);

        } catch (messageError) {
          console.error(`Error processing message ${message._id}:`, messageError);
          // Revert the sent status if there was an error
          message.sent = false;
          message.scheduled = true;
          await message.save();
        }
      }
    } catch (error) {
      console.error('Error in message scheduler:', error);
    }
  });
};

module.exports = { initializeMessageScheduler };