const router=require('express').Router()
const chatmodel=require('../models/chatmodel')
const messagemodel=require('../models/messagemodel')
const Authmiddleware=require('../middlewares/auth')
router.post('/create-new-chat',Authmiddleware,async(req,res)=>{
    try{
        const { members } = req.body;
        
       // Validate members array
    if (!Array.isArray(members) || members.length !== 2) {
        return res.status(400).send({
          message: "Exactly 2 members are required",
          success: false
        });
      }
  
      // Remove duplicates, convert to strings, and sort
      const sortedMembers = [...new Set(members.map(id => id.toString()))].sort();
      const UniquechatId = sortedMembers.join('_');

    //   if (sortedMembers.length !== 2) {
    //     return res.status(400).send({
    //       message: "Members must be two unique users",
    //       success: false
    //     });
    //   }
  
      // Check for existing chat
    //   const existingChat = await chatmodel.findOne({ members: sortedMembers });
      const existingChat = await chatmodel.findOne({ UniquechatId });
      if (existingChat) {
        await existingChat.populate('members')
        return res.status(200).send({
          message: "Chat already exists",
          success: true,
          data: existingChat
        });
      }
  
      // Create and save new chat
      const newchat = new chatmodel({ members: sortedMembers });

        const savedchat=await newchat.save()
        await savedchat.populate('members')
        return res.status(201).send({
            message:"chat created successfully",
            success:true,
            data:savedchat
        })
    }
    catch(error){
        return res.status(400).send({
            message:error.message,
            sucess:false
        })
    }
})
router.get('/get-all-chats',Authmiddleware,async(req,res)=>{
    try{
       console.log(req.body) 
       const allchat =await chatmodel.find({
            members:{$in : req.user._id}
        }).populate('members').populate('lastMessage').sort({updatedAt:-1})
        return res.status(200).send({
            message:"all char fetch succesfully",
            success:true,
            data:allchat
        })

    }
    catch(error){
        return res.status(400).send({
            message:error.message,
            success:false
        })

    }
})
router.post('/clear-unread-count',Authmiddleware,async(req,res)=>{
    try{
        const chatId=req.body.chatId
        //we want to update the unread message count in chat app
        const chat=await chatmodel.findById(chatId)
        if(!chat){
            res.send({
                message:"no chat found with given chatid",
                success:false
            })
        }
        const updatedchat=await chatmodel.findByIdAndUpdate(
            chatId,
            {unreadMessageCount:0},
            {new:true}).populate('members').populate('lastMessage')

        //we want to update the read property to true in message collection
        await messagemodel.updateMany({
           chatId:chatId,read:false
        },{$set:{read:true}})

        res.send({
            message:"unread message cleared succesfully",
            success:true,
            data:updatedchat
        })
        
    }
    catch(error){
     res.send({
        message:error.message,
        success:false
     })
    }
})
module.exports=router;