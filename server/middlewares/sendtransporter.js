const nodemailer=require('nodemailer')

const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth:{
       user:process.env.user,
       pass:process.env.pass
    }
})

module.exports={transporter}