const path = require("path");
const { randomTheme, WATERMARK_TEXT } = require("./theme");

/**
 * ১:১ (1080x1080) মিনিমাল ব্যানার তৈরি করে — সব সোর্সের জন্য একই কাঠামো:
 *   superTag   → ছোট লেবেল (যেমন "সরকারি চাকরি নোটিশ" / "শিক্ষা সংবাদ")
 *   badgeText  → বড় ক্যাটাগরি ট্যাগ (যেমন "বিসিএস", "শিক্ষক নিবন্ধন")
 *   headline   → মূল শিরোনাম (বড় ফন্ট)
 *   detail     → (ঐচ্ছিক) এক লাইনের সাপোর্টিং তথ্য
 *   outputName → temp ফাইলের নাম (প্রতিটা সোর্সের জন্য আলাদা যাতে collision না হয়)
 *
 * প্রতিবার কল হলে randomTheme() থেকে একটা নতুন রঙ বেছে নেয় — মানে প্রতিটা পোস্ট আলাদা রঙে যাবে।
 */
async function generateBannerImage(browser, { superTag, badgeText, headline, detail, outputName }) {
  const outputPath = path.join(__dirname, "..", "data", `${outputName}.jpg`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

  const theme = randomTheme();

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="bn">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@500;600;700;800;900&family=Hind+Siliguri:wght@500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1080px;
        height: 1080px;
        font-family: 'Anek Bangla', 'Hind Siliguri', sans-serif;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        position: relative;
      }

      /* একদম হালকা ওয়াটারমার্ক */
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-25deg);
        font-size: 48px;
        font-weight: 900;
        font-family: 'Poppins', sans-serif;
        color: ${theme.primary};
        opacity: 0.045;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1;
        width: 100%;
        text-align: center;
      }

      .header-box {
        background: linear-gradient(135deg, ${theme.primary}, #0f172a);
        color: #ffffff;
        text-align: center;
        padding: 26px 30px 22px 30px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        z-index: 2;
      }
      .header-supertitle {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 1px;
        color: rgba(255,255,255,0.75);
        margin-bottom: 10px;
      }
      .header-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.35);
        color: #fbbf24;
        padding: 8px 32px;
        border-radius: 30px;
        font-size: 30px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }

      .content-body {
        padding: 40px 60px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        gap: 26px;
        z-index: 2;
      }

      .headline {
        font-size: 42px;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.4;
        word-break: break-word;
      }

      .detail-box {
        background: ${theme.bgCard};
        border-left: 6px solid ${theme.accent};
        border-radius: 12px;
        padding: 18px 26px;
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
        line-height: 1.5;
        max-width: 900px;
      }

      .footer-container { padding: 0 30px 24px 30px; z-index: 2; }
      .footer-card {
        border: 2px solid ${theme.primary};
        border-radius: 12px;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      .footer-top-banner {
        background-color: #f8fafc;
        color: ${theme.primary};
        font-size: 16px;
        font-weight: 800;
        padding: 6px 12px;
        text-align: center;
        border-bottom: 2px dashed ${theme.primary};
      }
      .footer-main-body {
        background-color: ${theme.primary};
        color: #ffffff;
        padding: 10px 20px;
        text-align: center;
      }
      .brand-title { font-size: 30px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; }
      .footer-bottom-row { display: flex; align-items: center; justify-content: center; gap: 30px; }
      .brand-address { font-size: 19px; font-weight: 700; color: #e2e8f0; }
      .phone-section {
        display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800;
        background: rgba(255, 255, 255, 0.12); padding: 3px 14px; border-radius: 8px;
      }
      .social-icons { display: flex; gap: 8px; font-size: 20px; }
      .fa-whatsapp { color: #25D366; }
      .fa-telegram { color: #24A1DE; }
    </style>
  </head>
  <body>

    <div class="watermark">${WATERMARK_TEXT}</div>

    <div class="header-box">
      <div class="header-supertitle">${superTag}</div>
      <div class="header-badge">${badgeText}</div>
    </div>

    <div class="content-body">
      <div class="headline">${headline}</div>
      ${detail ? `<div class="detail-box">${detail}</div>` : ""}
    </div>

    <div class="footer-container">
      <div class="footer-card">
        <div class="footer-top-banner">যেকোন তথ্যে সহায়তায় যোগাযোগ করুন</div>
        <div class="footer-main-body">
          <div class="brand-title">এফ. এন. এফ কম্পিউটার &amp; অনলাইন সার্ভিসেস</div>
          <div class="footer-bottom-row">
            <div class="brand-address">📍 বাংলাবাজার রোড, বরিশাল।</div>
            <div class="phone-section">
              <div class="social-icons">
                <i class="fa-brands fa-whatsapp"></i>
                <i class="fa-brands fa-telegram"></i>
              </div>
              <span>01533199800</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </body>
  </html>
  `;

  try {
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
    await page.close();
    return outputPath;
  } catch (error) {
    console.error("ইমেজ তৈরিতে সমস্যা:", error.message);
    await page.close();
    return null;
  }
}

module.exports = { generateBannerImage };
