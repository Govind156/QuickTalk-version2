const express=require('express')
const router=express.Router()
const authmiddleware=require('../middlewares/auth')
const usermodel=require('../models/usermodel')
const chatmodel=require('../models/chatmodel')
const cloudinary = require('./../cloudinary');
router.get('/get-logged-user',authmiddleware,async(req,res)=>{
    try{
        // const user=await usermodel.findOne({_id:req.user._id})
        const user = await usermodel.findOne({ _id: req.user._id })
        .select('-password -verificationcode') // Exclude sensitive fields
        .lean(); // Faster read-only query
        
        return res.send({
            message:"user fetch successfully",
            success:true,
            data:user
        })

    }
    catch(error){
       return res.send({
        message:error.message,
        success:false
       })
    }
})
router.get('/get-all-users',authmiddleware,async(req,res)=>{
    try{
        const userid=req.user._id
        const allUsers=await usermodel.find({
                       _id:{$ne : userid}
        })
        // const allUsers = await usermodel.find(
        // { 
        //     _id: { $ne: userid },
        //     deleted: false // Use the soft-delete index
        // })
        // .select('firstName LastName ProfilePic themePreference') // Only needed fields
        // .lean();

        return res.send({
            message:"all users fetch successfully",
            success:true,
            data:allUsers
        })
    }
    catch(error){
        return res.send({
            message:error.message,
            success:false
        })

    }


})
router.post('/upload-profile-pic',authmiddleware,async(req,res)=>{
    try{
        const image=req.body.image
        
        //upload the image ro cloudinary
        const uploadImage=await cloudinary.uploader.upload(image,{folder:'QuickTalk'})
        
        //update the user model and set the profile pic
        // const user=await usermodel.findByIdAndUpdate(
        //     {_id:req.user._id},
        //     {ProfilePic:uploadImage.secure_url},
        //     {new:true})
        const user = await usermodel.findByIdAndUpdate(
        req.user._id, // Simpler syntax
        { ProfilePic: uploadImage.secure_url },
        { 
            new: true,
            select: '-password -verificationcode' // Exclude sensitive data
        }
        )
            
        // Emit the profile picture update to all connected users
        req.io.emit('profile-pic-updated', {
            userId: user._id,
            profilePic: user.ProfilePic
        });
        
        res.send({
            message:"profile pic upload successfully",
            success:true,
            data:user
        })    
    }catch(error){
      res.send({
        message:error.message,
        success:false
      })
    }
})
router.put('/theme', authmiddleware, async (req, res) => {
    try {
        const { userId, themePreference } = req.body;
        // const user = await usermodel.findByIdAndUpdate(
        //     userId,
        //     { themePreference },
        //     { new: true }
        // );
        const user = await usermodel.findByIdAndUpdate(
            userId,
            { themePreference },
            { 
                new: true,
                select: 'themePreference' // Only return what changed
            }
        )
        res.status(200).json({
            success: true,
            message: 'Theme preference updated',
            data:user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// usercontroller.js
router.delete('/delete-user/:userId', authmiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Soft delete: Mark user as deleted instead of actually deleting
        const user = await usermodel.findByIdAndUpdate(
            userId,
            { 
                deleted: true,
                deletedAt: new Date(),
                // Clear sensitive data
                firstName: 'Deleted',
                LastName: 'User',
                email: `deleted-${Date.now()}@example.com`,
                ProfilePic: null
            },
            { new: true,
              select: 'deleted deletedAt' // Only return deletion status  
             }
        );

        // Initialize affectedChats as empty array by default
        let affectedChats = [];
        
        try {
            // Only try to find chats if Chat model is available
            if (Chat) {
                affectedChats = await Chat.find({ members: userId }).distinct('_id');
            }
        } catch (chatError) {
            // If Chat model isn't available or query fails, just continue with empty array
            console.log("Could not fetch affected chats:", chatError.message);
        }


        // Notify all clients about the deletion
        req.io.emit('user-deleted', {
            // userId: user._id,
            userId:userId,
            deletedAt: new Date(),
            // Include all affected chat IDs
            affectedChats: affectedChats
        })

        res.send({
            message: "User account deleted successfully",
            success: true,
            data: user
        });
    } catch (error) {
        res.send({
            message: error.message,
            success: false
        });
    }
});
module.exports=router