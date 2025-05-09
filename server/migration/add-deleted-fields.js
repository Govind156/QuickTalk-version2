const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/usermodel'); // Adjust path as needed

// 1. Load config.env (instead of .env)
dotenv.config({ path: path.resolve(__dirname, '../config.env') })
async function migrate() {
  try {
    // 1. Connect to MongoDB
    const MONGO_URI = process.env.CONNECTION_STRING;
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 2. Count users to update
    const totalUsers = await User.countDocuments();
    console.log(`🔍 Found ${totalUsers} users to process`);

    // 3. Add deleted fields to all users
    const result = await User.updateMany(
      { deleted: { $exists: false } },
      { $set: { deleted: false, deletedAt: null } }
    );

    console.log(`🎉 Migration complete. Updated ${result.modifiedCount} users`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();