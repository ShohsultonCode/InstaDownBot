const { Schema, model } = require("mongoose");

const userModel = new Schema({
  user_name: {
    type: String,
    required: true,
  },
  user_phone_number: {
    type: Number,
  },
  user_telegram_username: {
    type: String,
  }

},
  {
    timestamps: true
  }
);

module.exports = model("Users", userModel);
