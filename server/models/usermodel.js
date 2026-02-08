const mongoose=require('mongoose')
const userschema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
    },
    LastName:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
       type:String,
       required:true,
       unique:true,
       trim:true,
       index:true,
       lowercase: true,
    },
    password:{
        type:String,
        required:true,
        select:false,
        minlength:8
    },
    ProfilePic:{
        type:String,
        required:false,
    },
    isVerified:{
        type:Boolean,
        default:false,
         index: true // Add index for faster queries
    },
    verificationcode:{
        type:String,
        index:true
    },
    themePreference: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
    },
    deleted: {
        type: Boolean,
        default: false,
        index: true // For faster queries
    },
    deletedAt: {
        type: Date,
        default: null
    }
},{timestamps:true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.verificationcode;
            return ret;
        }
  }
})

userschema.index({ email: 1, isVerified: 1 });

userschema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
        partialFilterExpression: { isVerified: false } // Only applies to unverified users
    }
);

const usermodel=mongoose.model('users',userschema)
module.exports=usermodel
