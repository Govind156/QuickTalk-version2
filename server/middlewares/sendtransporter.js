require('dotenv').config({path:'../config.env'})
const nodemailer=require('nodemailer')

const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    requireTLS:true,
    logger:true,
    debug:true,
    auth:{
       user:process.env.USER,
       pass:process.env.PASS
    }
})


module.exports={transporter}
//before port:587
//before port:465