const puppeteer = require("puppeteer");
const cron = require("node-cron");

// بيانات الدخول من Environment Variables في Railway
const EMAIL = process.env.TICK_EMAIL;
const PASSWORD = process.env.TICK_PASSWORD;

// لينك السيرفر (غيره برابط سيرفرك)
const SERVER_URL = "https://tickhosting.asia/server/0db58fac";

async function renewServer() {
  console.log(`[${new Date().toISOString()}] محاولة الدخول وعمل Renew...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://tickhosting.asia/auth/login", { waitUntil: "networkidle2" });

    // تسجيل الدخول
    await page.type("input[name='email']", EMAIL);
    await page.type("input[name='password']", PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForNavigation();

    console.log("✅ تم تسجيل الدخول");

    // افتح صفحة السيرفر
    await page.goto(SERVER_URL, { waitUntil: "networkidle2" });

    // دور على زرار "Renew" واضغطه
    const renewBtn = await page.$x("//*[contains(text(),'Renew')]");
    if (renewBtn.length > 0) {
      await renewBtn[0].click();
      console.log("✔️ تم الضغط على زرار Renew!");
    } else {
      console.log("⚠️ السيرفر لسه شغال أو مفيش زرار Renew دلوقتي.");
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await browser.close();
  }
}

// شغله أول ما البوت يقوم
renewServer();

// وجدول كل 5 دقايق
cron.schedule("*/5 * * * *", renewServer);
