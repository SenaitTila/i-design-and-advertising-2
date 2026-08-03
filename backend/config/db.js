const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // If you need global settings like autoIndex, set them via mongoose.set() 
    // or pass them in an options object if required by your setup.
    mongoose.set('autoIndex', true);

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;