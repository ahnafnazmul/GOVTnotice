// sarkarichakri24.com/notices থেকে সরকারি চাকরি নোটিশ স্ক্র্যাপ করে মিনিমাল HD ব্যানার তৈরি করে Telegram এ পাঠায়
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const { convertToBanglaDigitsAndMonths } = require("./common/theme");
const { generateBannerImage } = require("./common/banner");
const { sendTelegramPhoto } = require("./common/telegram");

const TARGET_URL = "https://www.sarkarichakri24.com/notices";
const SENT_FILE = path.join(__dirname, "data", "sent_notices_sc24.json");

// পরিচিত পরীক্ষা/নিয়োগ ক্যাটাগরি — টাইটেলের মধ্যে মিলিয়ে ব্যাজ হিসেবে দেখানো হবে
// (সাইটে যদি সত্যিকারের category কলাম থাকে, সেটা ব্যবহার করাই ভালো — প্রথম রানে চেক করে দরকার হলে আপডেট করো)
const CATEGORY_KEYWORDS = [
  "বিসিএস", "ব্যাংক", "শিক্ষক নিবন্ধন", "প্রাথমিক শিক্ষক", "পুলিশ", "আনসার",
  "রেলওয়ে", "নার্স", "স্বাস্থ্য", "দুদক", "প্রতিরক্ষা", "কৃষি", "জনতা ব্যাংক",
  "সোনালী ব্যাংক", "নিয়োগ বিজ্ঞপ্তি"
];

function detectCategory(title) {
  const found = CATEGORY_KEYWORDS.find(k => title.includes(k));
  return found || "সরকারি নিয়োগ";
}

function loadSentIds() {
  try { return new Set(JSON.parse(fs.readFileSync(SENT_FILE, "utf-8"))); }
  catch (e) { return new Set(); }
}

function saveSentIds(set) {
  fs.mkdirSync(path.dirname(SENT_FILE), { recursive: true });
  fs.writeFileSync(SENT_FILE, JSON.stringify(Array.from(set).slice(-500), null, 2), "utf-8");
}

function getPriorityMeta(priority) {
  const p = (priority || "Normal").trim().toLowerCase();
  if (p === "urgent") return { label: "জরুরি", emoji: "🔴" };
  if (p === "high") return { label: "গুরুত্বপূর্ণ", emoji: "🟠" };
  return { label: "সাধারণ", emoji: "🟢" };
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

    // NOTE: href প্যাটার্ন ধরে বানানো — প্রথম রানে console.log(notices) দিয়ে যাচাই করে নাও।
    const notices = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).filter(r => r.querySelectorAll('td').length >= 4);
      const data = [];
      for (const row of rows) {
        const cols = row.querySelectorAll('td');
        const dateText = cols[1] ? cols[1].innerText.replace(/\s+/g, ' ').trim() : "";
        const titleCell = cols[2] || null;
        const priorityText = cols[3] ? cols[3].innerText.replace(/\s+/g, ' ').trim() : "Normal";
        const fileType = cols[4] ? cols[4].innerText.replace(/\s+/g, ' ').trim() : "N/A";

        const linkEl = titleCell ? titleCell.querySelector('a[href*="/notices/"]') : null;
        if (!linkEl) continue;

        const href = linkEl.href;
        const isPinned = /pinned/i.test(titleCell.innerText);
        const titleText = linkEl.innerText.replace(/\s+/g, ' ').replace(/Pinned/i, '').trim();
        const idMatch = href.match(/-(\d+)\/?$/);
        const noticeId = idMatch ? idMatch[1] : href;

        data.push({ id: noticeId, url: href, date: dateText, title: titleText, priority: priorityText, fileType, pinned: isPinned });
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
          const category = detectCategory(notice.title);
          const priorityMeta = getPriorityMeta(notice.priority);
          const dateBn = convertToBanglaDigitsAndMonths(notice.date);

          const caption = [
            `📢 *নতুন নোটিশ (SarkariChakri24)*`,
            ``,
            notice.pinned ? `📌 *পিন করা নোটিশ*` : ``,
            `🏷️ *ক্যাটাগরি:* ${category}`,
            `📅 *তারিখ:* ${notice.date}`,
            `${priorityMeta.emoji} *গুরুত্ব:* ${priorityMeta.label}`,
            `📄 *ফাইল:* ${notice.fileType}`,
            `🔗 *বিস্তারিত:* ${notice.url}`,
            ``,
            `যেকোন সরকারি চাকরির প্রস্তুতি বা তথ্যে সহায়তায় যোগাযোগ করুন:`,
            `এফ. এন. এফ কম্পিউটার & অনলাইন সার্ভিসেস`,
            `বাংলাবাজার রোড, বরিশাল। 📱 01533199800`
          ].filter(Boolean).join("\n");

          const imagePath = await generateBannerImage(browser, {
            superTag: "সরকারি চাকরি নোটিশ",
            badgeText: category,
            headline: notice.title,
            detail: `${priorityMeta.emoji} ${priorityMeta.label} &nbsp;•&nbsp; 📅 ${dateBn} &nbsp;•&nbsp; 📄 ${notice.fileType}`,
            outputName: "temp_notice_banner"
          });

          if (imagePath && fs.existsSync(imagePath)) {
            await sendTelegramPhoto(imagePath, caption);
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
