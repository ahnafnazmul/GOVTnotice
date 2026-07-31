const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function sendTelegramPhoto(imagePath, caption) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID .env এ সেট নেই।");
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", fs.createReadStream(imagePath));
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");

    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, formData, {
      headers: formData.getHeaders()
    });
    console.log("Telegram এ ব্যানার সফলভাবে পাঠানো হয়েছে ✅");
    return true;
  } catch (e) {
    console.error("Telegram এ পাঠাতে সমস্যা:", e.message);
    return false;
  }
}

module.exports = { sendTelegramPhoto };
