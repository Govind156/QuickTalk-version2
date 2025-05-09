const nodemailer=require('nodemailer')

const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth:{
       user:"govindmadaan99@gmail.com",
       pass:"gncnhtvujpbcudnq"
    }
})

const SendEmail=async()=>{
    try{
        const info=await transporter.sendMail({
            from:`Govind Madaan😎 <govindmadaan99@gmail.com>`,
            to:"madan.govind153@gmail.com",
            subject:"welcome👋🏼",
            text:"ThankYou For Registering",
            html:"<b>Thankyou For Registering</b>",
        })
    console.log(info);
    }
    catch(error){
        console.log(error);
    }
}
// SendEmail()
module.exports={transporter,SendEmail}