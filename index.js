require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");
const connectDB = require("./config/index");
const User = require("./config/models/user.model");
const UserVideo = require("./config/models/video.model");

const TOKEN = process.env.TOKEN;
const bot = new TelegramApi(TOKEN, { polling: true });

// Connect to the database
connectDB();

// Function to download Instagram video
async function downloadInstagram(insta_url) {
  try {
    const response = await axios.get(
      "https://instagram-media-downloader.p.rapidapi.com/rapid/post.php",
      {
        params: { url: insta_url },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "instagram-media-downloader.p.rapidapi.com",
        },
      }
    );
    return {
      videoUrl: response.data.video,
      photoUrl: response.data.image,
      caption: response.data.caption,
    };
  } catch (error) {
    console.error("Error downloading Instagram video:", error);
    return null;
  }
}

// Function to split long text into chunks
function splitMessage(text, chunkSize = 4096) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Bot initialization and message handling
const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Start" },
  ]);

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
            // Handle the duplicate key error here, such as logging and notifying the user
          } else {
            console.error("Error handling message:", error);
          }
        }

        // Send a welcome message
        await bot.sendMessage(
          chatId,
          `Hi <b>${userName || "there"}</b>. If you want to download Instagram reels or videos, please send me a link.`,
          { parse_mode: "HTML" }
        );
        return;
      }

      // Check if the user is admin and message is /admin
      if (msg.text === "/admin" && isAdmin(userTelegramUsername)) {
        // Retrieve all users
        const users = await User.find();
        // Retrieve all videos
        const videos = await UserVideo.find();
        // Format data into a text table
        let textTable = "User ID | User Name | Phone Number | Telegram Username | Video Link\n";

        users.forEach((user) => {
          const videoLinks = videos
            .filter(
              (video) => video.user_id.toString() === user._id.toString()
            )
            .map((video) => video.video_link);
          // Table row
          textTable += `${user._id} | ${user.user_name} | ${user.user_phone_number} | ${user.user_telegram_username} | ${videoLinks.join(", ")}\n`;
        });

        // Split the text into chunks and send each chunk separately
        const chunks = splitMessage(textTable);
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk);
        }

        return;
      }

      const videoInfo = await downloadInstagram(msg.text);
      if (videoInfo && videoInfo.videoUrl) {
        // Get the user from the database
        const user = await User.findOne({
          user_telegram_username: userTelegramUsername,
        });
        if (user) {
          // Save the video link along with the user ID
          await UserVideo.create({
            user_id: user._id,
            video_link: msg.text,
          });
        }

        // Send the video to the user
        console.log(videoInfo.videoUrl);
        await bot.sendVideo(chatId, videoInfo.videoUrl, {
          caption: `${videoInfo.caption ? videoInfo.caption : "Something"
            }\n Our Channel @shohsultonblog`,
        });
      } else {
        await bot.sendMessage(
          chatId,
          "Unable to download the video. Please check the link and try again."
        );
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
};

// Function to check if the user is admin
function isAdmin(username) {
  // Your logic to determine if the user is admin
  // For demonstration purposes, let's assume only the user with username "shohsultonSP" is an admin
  return username === "shohsultonSP";
}

// Start the bot and new
start();
