const router=require('express').Router()
const Authmiddleware=require('../middlewares/auth')
const chatmodel = require('../models/chatmodel')
const messagemodel=require('../models/messagemodel')
// const { Configuration, OpenAIApi } = require("openai");
const OpenAI =require('openai');
const rateLimit = require('express-rate-limit');



const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: 'Too many AI requests, please try again later'
});

router.post('/new-message',Authmiddleware,async(req,res)=>{
    try{
        const scheduledTime = new Date(req.body.scheduledFor);
        const now = new Date();
              
        // Validate scheduled time (must be in the future)
        if (scheduledTime <= now) {
            return res.status(400).send({
                message: "Scheduled time must be in the future",
                success: false
            });
        }

        // Check if this is a scheduled message
        if (req.body.scheduledFor) {
            // Validate no duplicate scheduled messages
            const existing = await messagemodel.findOne({
              chatId: req.body.chatId,
              sender: req.body.sender,
              text: req.body.text,
              scheduledFor: req.body.scheduledFor,
              sent: false
            });
            
            if (existing) {
              return res.status(400).send({
                message: "Duplicate scheduled message",
                success: false
              });
            }
            
            
            // Add scheduling fields to the message
            req.body.scheduled = true;
            req.body.sent = false;
        }

        //create and store new messsage in message collection
        const Newmessage=new messagemodel(req.body)
        const savedMessage=await Newmessage.save()
        
        //Only update the chat's last message if it's not a scheduled message
        if (!req.body.scheduledFor){
            //update last message property in that chat present in chat collection
            const currentchat =await chatmodel.findOneAndUpdate(
                {
                  _id:req.body.chatId
                },
                {
                  lastMessage:savedMessage._id,
                  $inc:{unreadMessageCount:1}
                })
        }
        
        return res.status(201).send({
            message:req.body.scheduled ? "Message scheduled successfully" : "Message sent successfully",
            success:true,
            data:savedMessage
        })
    }
    catch(error){
        return res.status(400).send({
            message:error.message,
            success:false
        })
    }
})


router.get('/get-all-messages/:CHATID', Authmiddleware, async (req, res) => {
  try {
    const allMessages = await messagemodel.find({
      chatId: req.params.CHATID,
      $or: [
        { scheduled: false },
        { scheduled: true, sent: true }
      ]
    }).sort({ createdAt: 1 });
    
    res.status(200).send({
      message: "All messages fetched successfully",
      success: true,
      data: allMessages
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
      success: false
    });
  }
});

router.get('/scheduled', Authmiddleware, async (req, res) => {
    try {
        const messages = await messagemodel.find({ 
            chatId: req.query.chatId,
            sender: req.user._id, 
            scheduled: true,
            sent: false
          }).sort({ scheduledFor:1 })
          // .populate("sender", "firstName LastName ProfilePic")
          // .populate("chatId")
          // .populate({
          //   path: "chatId",
          //   populate: {
          //     path: "users",
          //     select: "firstName LastName ProfilePic email"
          //   }
          // });
      res.status(200).send({
        message:"all schedule message fetch succesfully",
        success:true,
        data:messages});
    } catch (error) {
      res.status(400).send({ 
        message: error.message,
        success:false
    });
    }
});
router.delete('/scheduled/:messageId', Authmiddleware, async (req, res) => {
    try {
      const { messageId } = req.params;
      const message = await messagemodel.findById(messageId);
      if (!message) {
        return res.status(404).send({ 
          message: "Message not found",
          success:false });
      }
      
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(401).send({ message: "Not authorized/sender can only delete their message",success:false });
      }
      
      if (!message.scheduled || message.sent) {
        return res.status(400).send({ message: "This message cannot be canceled",success:false });
      }

      await messagemodel.findByIdAndDelete(messageId);
      res.status(200).send({ message: "Scheduled message canceled",success:true});
    } catch (error) {
      res.status(400).send({ message: error.message,success:false});
    }
});
// router.put('/scheduled/:messageId', Authmiddleware, async (req, res) => {
//     try {
//       const { messageId } = req.params;
//       const { content, scheduledFor } = req.body; 
//       const message = await messagemodel.findById(messageId);
      
//       if (!message) {
//         return res.status(404).send({success:false, message: "Message not found" });
//       }
      
//       if (message.sender.toString() !== req.body.userId.toString()) {
//         return res.status(401).send({success:false, message: "Not authorized/sender only able to edit there own messages" });
//       }
      
//       if (!message.scheduled || message.sent) {
//         return res.status(400).send({ success:false,message: "This message cannot be edited" });
//       }
      
//       if (content) message.content = content;
      
//       if (scheduledFor) {
//         const scheduledTime = new Date(scheduledFor);
//         if (scheduledTime <= new Date()) {
//           return res.status(400).send({ success:false, message: "Scheduled time must be in the future" });
//         }
//         message.scheduledFor = scheduledTime;
//       }
      
//       await message.save();
      
//       const updatedMessage = await messagemodel.findById(messageId)
//                             .populate("sender", "firstName LastName ProfilePic")
//                             .populate("chatId")
//                             .populate({
//                                 path: "chatId",
//                                 populate: {
//                                 path: "members",
//                                 select: "firstName LastName ProfilePic email"
//                                 }
//                             });
      
//       res.status(200).send({success:true,data:updatedMessage});
//     } catch (error) {
//       res.status(400).send({success:false, message: error.message });
//     }
// });
router.get('/process-scheduled', async (req, res) => {
  try {
    const now = new Date();
    const messages = await messagemodel.find({
      scheduled: true,
      sent: false,
      scheduledFor: { $lte: now }
    });

    // Mark as sent and return
    await messagemodel.updateMany(
      { _id: { $in: messages.map(m => m._id) } },
      { $set: { sent: true, scheduled: false } }
    );

    res.status(200).send({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});
router.put('/scheduled/:messageId', Authmiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, scheduledFor ,sent,scheduled} = req.body;

    // Validate scheduled time
    const scheduledTime = new Date(scheduledFor);
    if (scheduledTime <= new Date()) {
      return res.status(400).send({
        success: false,
        message: "Scheduled time must be in the future"
      });
    }

    // Update in database while maintaining scheduled status
    const updatedMessage = await messagemodel.findOneAndUpdate(
      { _id: messageId, scheduled: true, sent: false },
      { 
        $set: {
          text,
          scheduledFor: scheduledTime,
          updatedAt: new Date(),
           // Explicitly maintain these flags
           scheduled: scheduled,
           sent: sent
        }
      },
      { new: true }
    ).populate("sender", "firstName LastName ProfilePic")
     .populate({
        path: "chatId",
        populate: {
          path: "members",
          select: "_id"
        }
     });

    if (!updatedMessage) {
      return res.status(404).send({ 
        success: false, 
        message: "Message not found or already sent" 
      });
    }

    // Prepare response data
    const responseData = {
      ...updatedMessage.toObject(),
      members: updatedMessage.chatId.members.map(m => m._id.toString())
    };

    // Emit update to all chat members
    if (req.io) {
      req.io.to(updatedMessage.chatId._id.toString()).emit('scheduled-message-updated', responseData);
    }

    res.status(200).send({ success: true, data: responseData });

  } catch (error) {
    console.error('Update error:', error);
    res.status(400).send({
      success: false,
      message: error.message
    });
  }
});
router.post('/process-scheduled', async (req, res) => {
  try {
    const now = new Date();
    const messages = await messagemodel.find({
      scheduled: true,
      sent: false,
      scheduledFor: { $lte: now }
    }).populate({
      path: "chatId",
      populate: {
        path: "members",
        select: "_id"
      }
    });

    const processedMessages = [];
    
    for (const message of messages) {
      try {
        // Mark as sent
        message.sent = true;
        message.scheduled = false;
        await message.save();

        // Update chat's last message
        await chatmodel.findByIdAndUpdate(message.chatId._id, {
          lastMessage: message._id,
          $inc: { unreadMessageCount: 1 }
        });

        processedMessages.push({
          ...message.toObject(),
          members: message.chatId.members.map(m => m._id.toString())
        });
      } catch (e) {
        console.error(`Failed to process message ${message._id}:`, e);
      }
    }

    // Emit to all relevant clients
    if (req.io) {
      processedMessages.forEach(msg => {
        msg.members.forEach(memberId => {
          req.io.to(memberId).emit('scheduled-message-sent', msg);
        });
      });
    }

    res.status(200).send({
      success: true,
      data: processedMessages
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// Add this new route
// router.post('/generate-ai-message', Authmiddleware, async (req, res) => {
//     try {
      
//         console.log('my AI key--',process.env.QuickTalk_yg); 

//         if(process.env.QuickTalk_yg === undefined){
//           console.log(`open ai key is undefined`)
//           return;
//         }

//         const openai = new OpenAI({
//             apiKey: process.env.QuickTalk_yg?.trim() 
//         });

//         const { prompt } = req.body;
//         console.log("in contro", prompt)

        
//         const response = await openai.chat.completions.create({
//           model: "gpt-3.5-turbo",
//           messages: [{ role: "user", content: prompt }],
//           max_tokens: 150,
//           temperature: 0.7,
//       });

//         const aiMessage = response.data.choices[0].message.content;
//         if (!aiMessage) {
//           throw new Error("No message content received from OpenAI");
//         }

//         console.log("in contro", aiMessage)

//         res.status(200).send({
//             success: true,
//             data: aiMessage,
//             message: "successfull"
//         });
//     } catch (error) {
//         console.error("AI generation error:", error);
//         res.status(500).send({
//             success: false,
//             message: "Failed to generate AI message",
//             error: error.message
//         });
//     }
// });

const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post('/generate-ai-message', Authmiddleware, async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GoogleGenAI_API_KEY);

    const { prompt } = req.body;
    console.log("in controller", prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Changed model name here

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiMessage = response.text();

    if (!aiMessage) {
      throw new Error("No message content received from Gemini");
    }

    console.log("AI response:", aiMessage);

    res.status(200).send({
      success: true,
      data: aiMessage,
      message: "successful"
    });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to generate AI message",
      error: error.message
    });
  }
});

module.exports=router

// Add these new routes
// Add these new controller functions
// const getScheduledMessages = ;
//   onst cancelScheduledMessage = ;
//   const editScheduledMessage = ;