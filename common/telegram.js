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

// ---------- Aggregator বটে পাঠানো (নতুন — Facebook automation-এর জন্য) ----------
// এই ফাংশন fail করলেও মূল sendTelegramPhoto-এর ফলাফলে কোনো প্রভাব পড়ে না,
// কারণ এটা সম্পূর্ণ try/catch দিয়ে সুরক্ষিত এবং error থ্রো করে না, শুধু false রিটার্ন করে।

async function sendAggregatorPhoto(imagePath, caption) {
  const token = process.env.AGGREGATOR_BOT_TOKEN;
  const chatId = process.env.AGGREGATOR_CHAT_ID;
  if (!token || !chatId) return false; // secret সেট করা না থাকলে চুপচাপ স্কিপ

  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", fs.createReadStream(imagePath));
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");

    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, formData, {
      headers: formData.getHeaders()
    });
    console.log("Aggregator বটে ছবি পাঠানো হলো ✅");
    return true;
  } catch (e) {
    console.error("Aggregator বটে পাঠাতে সমস্যা (মূল কাজে প্রভাব পড়েনি):", e.message);
    return false;
  }
}

module.exports = { sendTelegramPhoto, sendAggregatorPhoto };
