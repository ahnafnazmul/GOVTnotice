// sarkarichakri24.com/notices থেকে সরকারি চাকরি নোটিশ স্ক্র্যাপ করে মিনিমাল HD ব্যানার তৈরি করে Telegram এ পাঠায়
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const { generateBannerImage } = require("./common/banner");
const { sendTelegramPhoto, sendAggregatorPhoto } = require("./common/telegram");

const TARGET_URL = "https://www.sarkarichakri24.com/notices";
const SENT_FILE = path.join(__dirname, "data", "sent_notices_sc24.json");

function loadSentIds() {
  try { return new Set(JSON.parse(fs.readFileSync(SENT_FILE, "utf-8"))); }
  catch (e) { return new Set(); }
}

function saveSentIds(set) {
  fs.mkdirSync(path.dirname(SENT_FILE), { recursive: true });
  fs.writeFileSync(SENT_FILE, JSON.stringify(Array.from(set).slice(-500), null, 2), "utf-8");
}

// sarkarichakri24 প্রতিটা নোটিশের টাইটেল ইংরেজি + বাংলা দুই ভাষাতেই একসাথে লেখে
// (যেমন: "50th BCS Examination ... ৫০তম বিসিএস পরীক্ষা ...")
// প্রথম বাংলা ক্যারেক্টার থেকে শুরু করে বাকি অংশটাই আসল, স্বাভাবিক বাংলা টাইটেল —
// এটা কোনো মেশিন-ট্রান্সলেশন না, সাইট নিজেই যেভাবে লিখেছে সেভাবেই দেখানো হয়
function extractBanglaTitle(mixedTitle) {
  const match = mixedTitle.match(/[\u0980-\u09FF]/);
  if (!match) return mixedTitle.trim(); // বাংলা অংশ না পেলে যা আছে তাই ফেরত (fallback)
  return mixedTitle.slice(match.index).trim();
}

async function runScraperTask() {
  console.log("--- SarkariChakri24 নোটিশ স্ক্র্যাপ চেক শুরু ---", new Date().toLocaleString("bn-BD"));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const sentIds = loadSentIds();

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('table', { timeout: 20000 });

    const notices = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).filter(r => r.querySelectorAll('td').length >= 4);
      const data = [];
      for (const row of rows) {
        const cols = row.querySelectorAll('td');
        const titleCell = cols[2] || null;

        const linkEl = titleCell ? titleCell.querySelector('a[href*="/notices/"]') : null;
        if (!linkEl) continue;

        const href = linkEl.href;
        // পুরো title cell থেকে টেক্সট নেয়া হচ্ছে (শুধু <a> ট্যাগ থেকে না) —
        // কারণ কিছু নোটিশে বাংলা অংশটা anchor ট্যাগের বাইরে আলাদা এলিমেন্টে থাকে
        const rawTitle = titleCell.innerText.replace(/\s+/g, ' ').replace(/Pinned/i, '').trim();
        const idMatch = href.match(/-(\d+)\/?$/);
        const noticeId = idMatch ? idMatch[1] : href;

        data.push({ id: noticeId, url: href, rawTitle });
        if (data.length === 15) break;
      }
      return data;
    });

    const newNotices = notices.filter(n => !sentIds.has(n.id));
    if (newNotices.length === 0) {
      console.log("নতুন কোনো নোটিশ পাওয়া যায়নি।");
    } else {
      console.log(`${newNotices.length}টি নতুন নোটিশ প্রসেস করা হচ্ছে...`);
      for (const notice of newNotices) {
        try {
          const banglaTitle = extractBanglaTitle(notice.rawTitle);

          const caption = [
            `📢 *${banglaTitle}*`,
            ``,
            `যেকোন সরকারি চাকরির প্রস্তুতি বা তথ্যে সহায়তায় যোগাযোগ করুন:`,
            `এফ. এন. এফ কম্পিউটার & অনলাইন সার্ভিসেস`,
            `বাংলাবাজার রোড, বরিশাল। 📱 01533199800`
          ].join("\n");

          const imagePath = await generateBannerImage(browser, {
            headline: banglaTitle,
            outputName: "temp_notice_banner"
          });

          if (imagePath && fs.existsSync(imagePath)) {
            await sendTelegramPhoto(imagePath, caption);
            await sendAggregatorPhoto(imagePath, caption); // নতুন লাইন — একই ছবি aggregator বটেও পাঠানো হচ্ছে
            try { fs.unlinkSync(imagePath); } catch (e) {}
          }

          sentIds.add(notice.id);
          saveSentIds(sentIds);
        } catch (err) {
          console.error(`নোটিশ ${notice.id} প্রসেস করতে সমস্যা:`, err.message);
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
  console.log("SarkariChakri24 প্রসেসিং সম্পূর্ণ ✅");
  process.exit(0);
}).catch((err) => {
  console.error("রান টাইমে এরর:", err);
  process.exit(1);
});
