const mongoose=require('mongoose')
const chatschema=new mongoose.Schema({
    members:{
        type:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"users"
            }
        ]
    },
    UniquechatId: {
        type: String,
        // unique: true, // Uniqueness now enforced here
    },
    lastMessage:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"messages"
    },
    unreadMessageCount:{
        type:Number,
        default:0
    }
},{timestamps:true})

// Create index on chatId only
chatschema.index({ UniquechatId: 1 }, { unique: true })

chatschema.pre('save', function (next) {
    this.members.sort(); // ensure consistent order
    this.UniquechatId = this.members.join('_'); // build unique chatId
    next();
  });

// Add compound unique index on members array
// chatschema.index({ members: 1 }, { 
//     unique: true,
//     partialFilterExpression: {
//     'members.1': { $exists: true } // Only enforce when array has 2 members
//     }
// });

// Better duplicate key error handling
// chatschema.post('save', function(error, doc, next) {
//     if (error.name === 'MongoError' && error.code === 11000) {
//     next(new Error('Chat already exists between these users'));
//     } else {
//     next(error);
//     }
// });

// Update timestamp on save
// chatschema.pre('save', function(next) {
//     this.updatedAt = Date.now();
//     next();
// })


const chatmodel=mongoose.model("chats",chatschema)
module.exports=chatmodel;