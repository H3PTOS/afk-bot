require("dotenv").config();
const puppeteer = require("puppeteer");

async function renewServers() {
  const email = process.env.TICK_EMAIL;
  const password = process.env.TICK_PASSWORD;

  if (!email || !password) {
    console.error("❌ لازم تضيف TICK_EMAIL و TICK_PASSWORD");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🌍 بفتح صفحة TickHosting...");
    await page.goto("https://panel.tickhosting.com/auth/login", { waitUntil: "networkidle2" });

    // تسجيل الدخول
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log("✅ تم تسجيل الدخول");

    // صفحة السيرفرات
    await page.goto("https://panel.tickhosting.com/servers", { waitUntil: "networkidle2" });
    console.log("📋 جبت لستة السيرفرات");

    // دور على كل الأزرار اللي فيها كلمة Renew
    const renewButtons = await page.$x("//*[contains(text(),'Renew')]");

    if (renewButtons.length > 0) {
      console.log(`🔍 لقيت ${renewButtons.length} سيرفر محتاج تجديد`);
      for (let i = 0; i < renewButtons.length; i++) {
        try {
          await renewButtons[i].click();
          console.log(`✅ السيرفر رقم ${i + 1} اتجدد`);
          await page.waitForTimeout(2000);
        } catch (err) {
          console.log(`⚠️ السيرفر رقم ${i + 1} حصل فيه مشكلة: ${err.message}`);
        }
      }
    } else {
      console.log("⌛ مفيش أي سيرفر محتاج تجديد دلوقتي");
    }

  } catch (err) {
    console.error("⚠️ حصل Error عام:", err.message);
  } finally {
    await browser.close();
    console.log("🚪 قفلت المتصفح");
  }
}

// تشغيل اللوب كل 5 دقايق (300000 ms)
setInterval(renewServers, 300000);

// شغل أول مرة على طول
renewServers();
