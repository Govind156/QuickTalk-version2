require('dotenv').config({path:'../config.env'})
const { Welcome_Email_Template ,Verification_Email_Template} = require("./EmailTemplate");
// const {transporter}=require("./sendtransporter")
// const {Resend} = require('resend')
// const resend=new Resend(process.env.RESEND_API_KEY)
const {brevoApi}= require('../config/brevo.js')


// const Sendverificationcode=async(email,verificationcode)=>{
//     try{
//         const response=await resend.emails.send({
//             from:`QuickTalk <QuickTalk@resend.dev>`,
//             to:"govindmadaan99@gmail.com",
//             subject:"verify your code",
//             text:"verify your code",
//             html:Verification_Email_Template.replace("{verificationCode}",verificationcode),
//         })
//         //  const response=await transporter.sendMail({
//         //     from:process.env.USER,
//         //     to:email,
//         //     subject:"verify your code",
//         //     text:"verify your code",
//         //     html:Verification_Email_Template.replace("{verificationCode}",verificationcode),
//         // })
//         // console.log("SMTP RESPONSE:", {
//         // messageId: response.messageId,
//         // accepted: response.accepted,
//         // rejected: response.rejected
//         // });
//     return { success: true };

//     }
//     catch(error){
//         console.log(error)
//         return { success: false, message: error.message };
//     }
// }

// const WelcomeEmail=async(email,name)=>{
//     try{
//         const response=await resend.emails.send({
//             from:`QuickTalk <QuickTalk@resend.dev>`,
//             to:email,
//             subject:"Welcome to QuickTalk – Let’s Get Chatting! 🚀",
//             text:"Welcome",
//             html:Welcome_Email_Template.replace("{name}",name),
//         })
//         //  const response=await transporter.sendMail({
//         //     from:process.env.USER,
//         //     to:email,
//         //     subject:"Welcome to QuickTalk – Let’s Get Chatting! 🚀",
//         //     text:"Welcome",
//         //     html:Welcome_Email_Template.replace("{name}",name),
//         // })
//     }
//     catch(error){
//         console.log(error);
//     }
// }





 const Sendverificationcode = async (email, code) => {
  try {
    await brevoApi.sendTransacEmail({
      sender: {
        name: "Govind Madaan",
        email: "govindmadaan999@gmail.com",
      },
      to: [{email}],
      subject: "Verify your account",
      htmlContent: Verification_Email_Template.replace(
        "{verificationCode}",
        code
      ),
    });

    return { success: true };
  } catch (error) {
        console.error("BREVO verification EMAIL ERROR:", {
        message: error?.message,
        code: error?.code,
        response: error?.response?.text,
        });
    return {
      success: false,
      message: "Failed to send verification email",
    };
  }
};


const WelcomeEmail = async (email, name) => {
  try {
    await brevoApi.sendTransacEmail({
      sender: {
        name: "Govind Madaan",
        email: "govindmadaan999@gmail.com",
      },
      to: [{ email }],
      subject: "Welcome to QuickTalk – Let’s Get Chatting! 🚀",
      htmlContent: Welcome_Email_Template.replace("{name}", name),
    });

    return { success: true };
  } catch (error) {
    console.error("BREVO WELCOME EMAIL ERROR:", {
      message: error?.message,
      code: error?.code,
      response: error?.response?.text,
    });

    return {
      success: false,
      message: "Failed to send welcome email",
    };
  }
};

module.exports={Sendverificationcode,WelcomeEmail}