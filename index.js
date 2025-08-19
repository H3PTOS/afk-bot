const puppeteer = require("puppeteer");
const cron = require("node-cron");

// لينك السيرفر بتاعك في Aternos (غيره باللينك الصح)
const SERVER_URL = "https://aternos.org/server/XXXXXXX"; 

// الفانكشن اللي بتعمل رينيو
async function renewServer() {
  console.log(`[${new Date().toISOString()}] محاولة تشغيل السيرفر...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.goto(SERVER_URL, { waitUntil: "networkidle2" });

    // لو محتاج تسجيل دخول ضيف هنا user/pass بتوعك
    // await page.type("#user", "اسم_الايميل");
    // await page.type("#password", "الباسورد");
    // await page.click("#login-button");
    // await page.waitForNavigation();

    // دوس على زرار Start (غير السليكتور حسب الزرار)
    const startBtn = await page.$("button.start"); 
    if (startBtn) {
      await startBtn.click();
      console.log("✔️ تم الضغط على Start!");
    } else {
      console.log("⚠️ ملقتش الزرار!");
    }

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await browser.close();
  }
}

// شغله أول ما البوت يقوم
renewServer();

// وجدول كل 5 دقايق
cron.schedule("*/5 * * * *", renewServer);
