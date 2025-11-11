require('dotenv').config({path:'../config.env'})
const nodemailer=require('nodemailer')

const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:465,
    secure:false,
    auth:{
       user:process.env.USER,
       pass:process.env.PASS
    }
})

module.exports={transporter}
//before port:587