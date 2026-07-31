# gov-notice-news-bot

দুইটা স্ক্র্যাপার একই রিপোতে:

- `sarkarichakri_scrape.js` → sarkarichakri24.com/notices থেকে সরকারি চাকরি নোটিশ
- `studentsbd_scrape.js` → students.bd/bn/news থেকে শিক্ষা সংবাদ

দুইটাই একই ডিজাইন টেমপ্লেট ব্যবহার করে (`common/banner.js`) — ১:১ (1080x1080), হালকা ওয়াটারমার্ক, প্রতিটা পোস্টে র‍্যান্ডম আলাদা রঙ।

## সেটআপ

```bash
npm install
cp .env.example .env
# .env এ TELEGRAM_BOT_TOKEN আর TELEGRAM_CHAT_ID বসাও
```

## রান করা

```bash
npm run start:job     # sarkarichakri24 নোটিশ চেক
npm run start:news    # students.bd সংবাদ চেক
```

দুটোকেই cron / PM2 / Task Scheduler দিয়ে নির্দিষ্ট সময় পরপর অটোমেটিক চালানো যাবে।

## প্রথম রানের আগে যাচাই করো

সাইটের raw HTML class দেখে সিলেক্টর কনফার্ম করা হয়নি (শুধু href প্যাটার্ন ধরে লেখা)। প্রথমবার রান করে
`sarkarichakri_scrape.js` এর `notices` অ্যারে বা `studentsbd_scrape.js` এর `newsItems` অ্যারে temporarily
`console.log` করে ডাটা ঠিকমতো আসছে কিনা দেখে নাও। সমস্যা হলে জানিও, সিলেক্টর ফিক্স করে দেব।

## ফোল্ডার স্ট্রাকচার

```
gov-notice-news-bot/
├── common/
│   ├── theme.js      # কালার থিম + বাংলা ডিজিট কনভার্টার
│   ├── banner.js     # শেয়ারড ১:১ ব্যানার টেমপ্লেট
│   └── telegram.js   # sendTelegramPhoto()
├── data/             # sent_*.json (dedupe) + temp ব্যানার — .gitignore করা
├── sarkarichakri_scrape.js
├── studentsbd_scrape.js
├── package.json
└── .env.example
```
