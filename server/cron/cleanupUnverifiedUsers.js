// import cron from "node-cron";
// import User from "../models/User.js";
const cron =require('node-cron')
const usermodel=require('../models/usermodel')


// Runs every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  try {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const result = await usermodel.deleteMany({
      isVerified: false,
      createdAt: { $lt: sevenDaysAgo }
    });

    console.log(
      `🧹 Cleanup done: ${result.deletedCount} unverified users removed`
    );
  } catch (error) {
    console.error("❌ Cleanup job failed:", error);
  }
});
