require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");
const connectDB = require("./config/index");
const User = require("./config/models/user.model");
const UserVideo = require("./config/models/video.model");

const TOKEN = process.env.TOKEN;
const bot = new TelegramApi(TOKEN, { polling: true });

connectDB();

async function downloadInstagram(insta_url) {
  try {
    const response = await axios.get(
      `https://getapi.uz/api/downloaders/instagram/v3/instagram/?url=${insta_url}`
    );

    if (response.data.ok && response.data.result && response.data.result.length > 0) {
      const videoUrl = response.data.result[0].url;
      return {
        videoUrl: videoUrl,
        photoUrl: null, // No photo URL in this case
        caption: null, // No caption in this case
      };
    } else {
      throw new Error("No video found");
    }
  } catch (error) {
    console.error("Error downloading Instagram video:", error);
    return null;
  }
}

function splitMessage(text, chunkSize = 4096) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

const start = () => {
  bot.setMyCommands([{ command: "/start", description: "Start" }]);

  bot.on("message", async (msg) => {
    try {
      const chatId = msg.chat.id; // Extracting chat_id from the message
      const userTelegramUsername = msg.from?.username || null;
      const userName = msg.from.first_name || "Unknown";
      const userPhoneNumber = msg.contact ? msg.contact.phone_number : null;

      if (!chatId) {
        console.error("Error: chatId is null.");
        return;
      }

      if (msg.text === "/start") {
        try {
          const checkUser = await User.findOne({
            user_telegram_username: userTelegramUsername,
          });
          if (!checkUser) {
            const createUser = await User.create({
              user_name: userName || "Unknown",
              user_phone_number: userPhoneNumber || null,
              user_telegram_username: userTelegramUsername || "Unknown",
            });
            await createUser.save();
          }
        } catch (error) {
          if (
            error.code === 11000 &&
            error.keyValue &&
            error.keyValue.chatId === null
          ) {
            console.error(
              "Error: Duplicate key error for chatId with null value."
            );
          } else {
            console.error("Error handling message:", error);
          }
        }

        await bot.sendMessage(
          chatId,
          `Hi <b>${userName || "there"}</b>. If you want to download Instagram reels or videos, please send me a link.`,
          { parse_mode: "HTML" }
        );
        return;
      }

      if (msg.text === "/admin" && isAdmin(userTelegramUsername)) {
        const users = await User.find();
        const videos = await UserVideo.find();
        
        // Send the total number of users and videos
        await bot.sendMessage(chatId, `Total users: ${users.length}\nTotal videos: ${videos.length}`);

        let textTable = "User ID | User Name | Phone Number | Telegram Username | Video Link\n";

        users.forEach((user) => {
          const videoLinks = videos
            .filter((video) => video.user_id.toString() === user._id.toString())
            .map((video) => video.video_link);
          textTable += `${user._id} | ${user.user_name} | ${user.user_phone_number} | ${user.user_telegram_username} | ${videoLinks.join(", ")}\n`;
        });

        const chunks = splitMessage(textTable);
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk);
        }

        return;
      }

      // Send a loading message
      const loadingMessage = await bot.sendMessage(chatId, "Processing your request, please wait...");

      const videoInfo = await downloadInstagram(msg.text);
      if (videoInfo && videoInfo.videoUrl) {
        const user = await User.findOne({
          user_telegram_username: userTelegramUsername,
        });
        if (user) {
          await UserVideo.create({
            user_id: user._id,
            video_link: msg.text,
          });
        }

        // Delete the loading message
        await bot.deleteMessage(chatId, loadingMessage.message_id);

        // Send the video
        await bot.sendVideo(chatId, videoInfo.videoUrl, {
          caption: `${videoInfo.caption ? videoInfo.caption : "Something"}\n Our Channel @shohsultonblog`,
        });
      } else {
        // Update the loading message with an error message
        await bot.editMessageText("Unable to download the video. Please check the link and try again.", {
          chat_id: chatId,
          message_id: loadingMessage.message_id,
        });
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
};

function isAdmin(username) {
  return username === "shohsultonSP";
}

start();
