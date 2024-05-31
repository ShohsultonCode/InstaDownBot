require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");
const connectDB = require("./config");
const User = require("./models/user.model");
const UserVideo = require("./models/video.model");

const TOKEN = process.env.TOKEN;  
const bot = new TelegramApi(TOKEN, { polling: true });

// Connect to the database
connectDB();

// Function to download Instagram video
async function downloadInstagram(insta_url) {
  try {
    const response = await axios.get("https://instagram-media-downloader.p.rapidapi.com/rapid/post.php", {
      params: { url: insta_url },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "instagram-media-downloader.p.rapidapi.com",
      },
    });
    return {
      videoUrl: response.data.video,
      photoUrl: response.data.image,
      caption: response.data.caption
    };
  } catch (error) {
    console.error("Error downloading Instagram video:", error);
    return null;
  }
}
 
// Bot initialization and message handling
const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Start" }
  ]);

  bot.on("message", async (msg) => {
    try {
      if (msg.text === "/start") {
        // Create or update user in the database
        await User.findOneAndUpdate(
          { user_telegram_username: msg.from.username },
          {
            user_name: msg.from.first_name,
            user_phone_number: msg.contact?.phone_number, // Assuming the user provides their phone number
            user_telegram_username: msg.from.username
          },
          { upsert: true, new: true }
        );

        // Send a welcome message
        await bot.sendMessage(
          msg.chat.id,
          `Hi <b>${msg.from.first_name}</b>. If you want to download Instagram reels or videos, please send me a link.`,
          { parse_mode: 'HTML' }  
        );
        return;
      }

      const chatId = msg.chat.id; // Extracting chat_id from the message
      const videoInfo = await downloadInstagram(msg.text);
      if (videoInfo && videoInfo.videoUrl) {
        // Get the user from the database
        const user = await User.findOne({ user_telegram_username: msg.from.username });
        if (user) {
          // Save the video link along with the user ID
          await UserVideo.create({
            user_id: user._id,
            video_link: msg.text
          });
        }

        // Send the video to the user
        await bot.sendVideo(
          chatId, // Sending the message to the correct chat
          videoInfo.videoUrl,
          { caption: `${videoInfo.caption}\nOur Channel @shohsultonblog` }
        );
      } else {
        await bot.sendMessage(chatId, "Unable to download the video. Please check the link and try again.");
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
};

// Start the bot
start();
