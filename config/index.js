const mongoose = require("mongoose");

//Database connection function 
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO, {
    });

    console.log(`MongoDB connected to: ${conn.connection.host}`);
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
