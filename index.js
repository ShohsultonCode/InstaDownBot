require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");
const api = process.env.TOKEN;  
const bot = new TelegramApi(api, { polling: true });

async function downloadIns(insta_url) {z
  try {
    const options = {
      method: "GET",
      url: "https://instagram-media-downloader.p.rapidapi.com/rapid/post.php",
      params: { url: insta_url },
      headers: {
        "X-RapidAPI-Key": "25415b622emshc4c6c96d8990326p111fb7jsn0ea4a69a9112",
        "X-RapidAPI-Host": "instagram-media-downloader.p.rapidapi.com",
      },
    };
    const response = await axios.request(options);
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

      const getVideoUrl = await downloadIns(msg.text);
      if (getVideoUrl && getVideoUrl.videoUrl) {
        await bot.sendVideo(
          msg.chat.id,
          getVideoUrl.videoUrl,
          {
            caption: `${getVideoUrl.caption}\nOur Channel @shohsultonblog`
          }
        );
      } else {
        await bot.sendMessage(msg.chat.id, "Unable to download the video. Please check the link and try again.");
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }

    try {
      await bot.sendMessage(1764255740, `New User. Name: ${msg.from.first_name} (${msg.from.username}), Message: ${msg.text}`);
    } catch (error) {
      console.error("Error sending notification to admin:", error);
    }
  });
};

start();
