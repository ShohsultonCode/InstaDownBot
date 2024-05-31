const { Schema, model } = require("mongoose");

const userVideoModel = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  video_link: {
    type: String,
    required: true
  },
},
  {
    timestamps: true
  }
);

module.exports = model("Videos", userVideoModel);
