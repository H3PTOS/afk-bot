require('dotenv').config();
const puppeteer = require('puppeteer');
const cron = require('node-cron');

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const SERVER_URL = process.env.SERVER_URL;

async function renewServer() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
        // تسجيل الدخول
        await page.goto('https://tickhosting.asia/login', { waitUntil: 'networkidle2' });
        await page.type('input[name=email]', EMAIL);
        await page.type('input[name=password]', PASSWORD);
        await page.click('button[type=submit]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // الدخول على صفحة السيرفر
        await page.goto(SERVER_URL, { waitUntil: 'networkidle2' });

        // الضغط على زر Renew
        const renewButtonSelector = 'button:contains("Renew")';
        await page.click(renewButtonSelector);

        console.log('✅ السيرفر تم تجديده بنجاح');
    } catch (err) {
        console.error('❌ حصل خطأ أثناء التجديد:', err);
    } finally {
        await browser.close();
    }
}

// جدولة كل 24 ساعة
cron.schedule('0 0 * * *', () => {
    console.log('🔄 بدء عملية التجديد');
    renewServer();
});

// تشغيل أول مرة مباشرة
renewServer();
