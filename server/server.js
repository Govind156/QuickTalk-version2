//server.js is now our entry point
// const express=require('express')
// const server=require('./app')

// const dotenv=require('dotenv')

// //the environment variable of these path is save in env object which is one of an object or process object 
// dotenv.config({path:'./config.env'})

// const dbconnect=require('../server/config/dbconfig')

// //PORT is a property of env object which is an object of process object
// const port=process.env.PORT || 3000



// //listen
// server.listen(port,()=>{
//     console.log(`listen to request on PORT: ${port}`);
// });
// server/server.js
const express = require('express');
const server = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/dbconfig');

dotenv.config({ path: './config.env' });

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Verify required environment variables
    if (!process.env.CONNECTION_STRING) {
      throw new Error('Missing CONNECTION_STRING in environment variables');
    }

    await connectDB();
    
    server.listen(port, () => {
      console.log(`Server listening on port: ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();