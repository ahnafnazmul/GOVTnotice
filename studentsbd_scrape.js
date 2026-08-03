// students.bd/bn/news থেকে শিক্ষা সংবাদ স্ক্র্যাপ করে মিনিমাল HD ব্যানার তৈরি করে Telegram এ পাঠায়
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const { generateBannerImage } = require("./common/banner");
const { sendTelegramPhoto, sendAggregatorPhoto } = require("./common/telegram");

const TARGET_URL = "https://students.bd/bn/news";
const SENT_FILE = path.join(__dirname, "data", "sent_news_studentsbd.json");

function loadSentIds() {
  try { return new Set(JSON.parse(fs.readFileSync(SENT_FILE, "utf-8"))); }
  catch (e) { return new Set(); }
}

function saveSentIds(set) {
  fs.mkdirSync(path.dirname(SENT_FILE), { recursive: true });
  fs.writeFileSync(SENT_FILE, JSON.stringify(Array.from(set).slice(-500), null, 2), "utf-8");
}

async function runScraperTask() {
  console.log("--- students.bd শিক্ষা সংবাদ স্ক্র্যাপ চেক শুরু ---", new Date().toLocaleString("bn-BD"));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const sentIds = loadSentIds();

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('a[href*="/bn/news/"]', { timeout: 20000 });

    const newsItems = await page.evaluate(() => {
      const titleLinks = Array.from(document.querySelectorAll('h2 a[href*="/bn/news/"]'));
      const data = [];
      for (const link of titleLinks) {
        const href = link.href;
        const slugMatch = href.match(/\/bn\/news\/([a-z0-9-]+)\/?$/i);
        const slug = slugMatch ? slugMatch[1] : href;
        if (slug === "news") continue;

        const title = link.innerText.replace(/\s+/g, ' ').trim();
        data.push({ id: slug, url: href, title });
        if (data.length === 15) break;
      }
      return data;
    });

    const newItems = newsItems.filter(n => !sentIds.has(n.id));
    if (newItems.length === 0) {
      console.log("নতুন কোনো শিক্ষা সংবাদ পাওয়া যায়নি।");
    } else {
      console.log(`${newItems.length}টি নতুন সংবাদ প্রসেস করা হচ্ছে...`);
      for (const item of newItems) {
        try {
          const caption = [
            `📰 *${item.title}*`,
            ``,
            `শিক্ষা সংক্রান্ত যেকোন তথ্যে সহায়তায় যোগাযোগ করুন:`,
            `এফ. এন. এফ কম্পিউটার & অনলাইন সার্ভিসেস`,
            `বাংলাবাজার রোড, বরিশাল। 📱 01533199800`
          ].join("\n");

          const imagePath = await generateBannerImage(browser, {
            headline: item.title,
            outputName: "temp_news_banner"
          });

          if (imagePath && fs.existsSync(imagePath)) {
            await sendTelegramPhoto(imagePath, caption);
            await sendAggregatorPhoto(imagePath, caption); // নতুন লাইন — একই ছবি aggregator বটেও পাঠানো হচ্ছে
            try { fs.unlinkSync(imagePath); } catch (e) {}
          }

          sentIds.add(item.id);
          saveSentIds(sentIds);
        } catch (err) {
          console.error(`সংবাদ ${item.id} প্রসেস করতে সমস্যা:`, err.message);
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    await page.close();
  } catch (err) {
    console.error("প্রধান স্ক্র্যাপিংয়ে সমস্যা:", err.message);
  } finally {
    await browser.close();
  }
}

runScraperTask().then(() => {
  console.log("students.bd প্রসেসিং সম্পূর্ণ ✅");
  process.exit(0);
}).catch((err) => {
  console.error("রান টাইমে এরর:", err);
  process.exit(1);
});
