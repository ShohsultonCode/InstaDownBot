const { Schema, model } = require("mongoose");

const userModel = new Schema({
  user_name: String,
  user_phone_number: String, // Change the type to String
  user_telegram_username: String
},
  {
    timestamps: true
  }
);

module.exports = model("Users", userModel);
