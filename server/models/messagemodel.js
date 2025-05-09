const mongoose=require('mongoose')

const messageschema=new mongoose.Schema({
    chatId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"chats"
    },
    text:{
        type:String,
        required:false
    },
    image:{
        type:String,
        required:false
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    read:{
        type:Boolean,
        default:0
    },
    // Add these fields to your existing Message schema
    scheduled: {
      type: Boolean,
      default: false
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    sent: {
      type: Boolean,
      default: false
    },
},{timestamps:true})
const messagemodel=mongoose.model("messages",messageschema)
module.exports=messagemodel;