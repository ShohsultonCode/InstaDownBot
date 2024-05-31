const mongoose = require("mongoose");

//Database connection function 
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://shohsultoncode:Shoh2006sulton$@db1.uivcbgk.mongodb.net/', {
      useNewUrlParser: true,
    });

    console.log(`MongoDB connected to: ${conn.connection.host}`);
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
