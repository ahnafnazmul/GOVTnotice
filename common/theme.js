// শেয়ারড থিম কনফিগ — দুই স্ক্র্যাপারই এখান থেকে রঙ ও ইউটিলিটি নেয়
// প্রতিবার ব্যানার তৈরির সময় randomTheme() কল হলে ভিন্ন ভিন্ন রঙ বেছে নেয় (প্রতিটা পোস্টের জন্য আলাদা)

const WATERMARK_TEXT = "FNF COMPUTER & ONLINE SERVICES";

const COLOR_THEMES = [
  { primary: "#0a3c22", accent: "#059669", bgCard: "#f0fdf4" }, // Forest Green
  { primary: "#0f2b48", accent: "#2563eb", bgCard: "#eff6ff" }, // Navy Blue
  { primary: "#4c1d95", accent: "#d97706", bgCard: "#fef3c7" }, // Violet Amber
  { primary: "#7c2d12", accent: "#ea580c", bgCard: "#fff7ed" }, // Terracotta
  { primary: "#134e4a", accent: "#0d9488", bgCard: "#f0fdfa" }, // Teal
  { primary: "#581c87", accent: "#c026d3", bgCard: "#fdf4ff" }, // Purple Magenta
  { primary: "#1e293b", accent: "#0ea5e9", bgCard: "#f0f9ff" }  // Slate Sky
];

function randomTheme() {
  return COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)];
}

// ইংরেজি ডিজিট ও মাস বাংলায় রূপান্তর
function convertToBanglaDigitsAndMonths(text) {
  if (!text) return "N/A";
  const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  const months = {
    'Jan': 'জানুয়ারি', 'Feb': 'ফেব্রুয়ারি', 'Mar': 'মার্চ', 'Apr': 'এপ্রিল',
    'May': 'মে', 'Jun': 'জুন', 'Jul': 'জুলাই', 'Aug': 'আগস্ট',
    'Sep': 'সেপ্টেম্বর', 'Oct': 'অক্টোবর', 'Nov': 'নভেম্বর', 'Dec': 'ডিসেম্বর'
  };
  let str = String(text);
  Object.keys(months).forEach(enM => {
    str = str.replace(new RegExp(enM, 'gi'), months[enM]);
  });
  return str.replace(/[0-9]/g, w => digits[w]);
}

module.exports = { WATERMARK_TEXT, COLOR_THEMES, randomTheme, convertToBanglaDigitsAndMonths };
