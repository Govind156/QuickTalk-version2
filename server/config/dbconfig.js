//connecting express to mongodb database
// const mongoose=require('mongoose')
// //connection logic
// mongoose.connect(process.env.CONNECTION_STRING)
// //connection state
// const db=mongoose.connection
// //if connect event occured
// db.on('connected',()=>{
//     console.log(`db connection successfully`);
// })
// //if error event occured
// db.on('err',()=>{
//     console.log(`db connection failed`)
// });
// module.exports=db
// config/dbconfig.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Please verify:');
    console.log('1. Your IP is whitelisted in MongoDB Atlas');
    console.log('2. Your connection string is correct');
    console.log('3. Your network allows outbound connections to MongoDB');
    process.exit(1);
  }
};

mongoose.connection.on('error', err => {
  console.error('MongoDB connection lost:', err);
});

module.exports = connectDB;