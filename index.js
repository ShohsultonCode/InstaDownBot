require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");
const connectDB = require("./config");


const TOKEN = process.env.TOKEN;  
const bot = new TelegramApi(TOKEN, { polling: true });

connectDB()

async function downloadInstagram(insta_url) {
  try {
    const response = await axios.get("https://instagram-media-downloader.p.rapidapi.com/rapid/post.php", {
      params: { url: insta_url },
      headers: {
        "X-RapidAPI-Key": "f2540d495emsh79f8cd9e6c27c93p116d29jsn2432dcacc31d",
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
 
const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Start" }
  ]);

  bot.on("message", async (msg) => {
    try {
      if (msg.text === "/start") {
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

    try {
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (adminChatId) {
        await bot.sendMessage(adminChatId, `New User. Name: ${msg.from.first_name} (${msg.from.username}), Message: ${msg.text}`);
      } else {
        console.error("Admin chat ID not configured.");
      }
    } catch (error) {
      console.error("Error sending notification to admin:", error);
    }
  });
};

start();
