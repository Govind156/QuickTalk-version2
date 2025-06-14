const { Welcome_Email_Template ,Verification_Email_Template} = require("./EmailTemplate");
const {transporter}=require("./sendtransporter")
const Sendverificationcode=async(email,verificationcode)=>{
    try{
        const response=await transporter.sendMail({
            from:`Govind Madaan😎 <govindmadaan99@gmail.com>`,
            to:email,
            subject:"verify your code",
            text:"verify your code",
            html:Verification_Email_Template.replace("{verificationCode}",verificationcode),
        })
    return { success: true };

    }
    catch(error){
        return { success: false, message: error.message };
    }
}
const WelcomeEmail=async(email,name)=>{
    try{
        const response=await transporter.sendMail({
            from:`Govind Madaan😎 <govindmadaan99@gmail.com>`,
            to:email,
            subject:"Welcome to QuickTalk – Let’s Get Chatting! 🚀",
            text:"Welcome",
            html:Welcome_Email_Template.replace("{name}",name),
        })
    }
    catch(error){
        console.log(error);
    }
}
module.exports={Sendverificationcode,WelcomeEmail}