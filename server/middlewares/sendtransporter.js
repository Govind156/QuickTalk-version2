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


module.exports={transporter,SendEmail}