require('dotenv').config({path:'../config.env'})
const { Welcome_Email_Template ,Verification_Email_Template} = require("./EmailTemplate");
const {transporter}=require("./sendtransporter")
const {Resend} = require('resend')
const resend=new Resend(process.env.RESEND_API_KEY)


const Sendverificationcode=async(email,verificationcode)=>{
    try{
        // const response=await resend.emails.send({
        //     from:`QuickTalk <QuickTalk@resend.dev>`,
        //     to:email,
        //     subject:"verify your code",
        //     text:"verify your code",
        //     html:Verification_Email_Template.replace("{verificationCode}",verificationcode),
        // })
         const response=await transporter.sendMail({
            from:process.env.USER,
            to:email,
            subject:"verify your code",
            text:"verify your code",
            html:Verification_Email_Template.replace("{verificationCode}",verificationcode),
        })
    return { success: true };

    }
    catch(error){
        console.log(error)
        return { success: false, message: error.message };
    }
}
const WelcomeEmail=async(email,name)=>{
    try{
        // const response=await resend.emails.send({
        //     from:`QuickTalk <QuickTalk@resend.dev>`,
        //     to:email,
        //     subject:"Welcome to QuickTalk – Let’s Get Chatting! 🚀",
        //     text:"Welcome",
        //     html:Welcome_Email_Template.replace("{name}",name),
        // })
         const response=await transporter.sendMail({
            from:process.env.USER,
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