require('dotenv').config();
const puppeteer = require('puppeteer');
const cron = require('node-cron');

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const SERVER_URL = process.env.SERVER_URL;

async function checkAndRenew() {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://tickhosting.asia/login', { waitUntil: 'networkidle2' });
        await page.type('input[name=email]', EMAIL);
        await page.type('input[name=password]', PASSWORD);
        await page.click('button[type=submit]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        await page.goto(SERVER_URL, { waitUntil: 'networkidle2' });

        const renewButton = await page.$('button:contains("Renew")');
        if (renewButton) {
            await renewButton.click();
            console.log('✅ السيرفر تم تجديده');
        } else {
            console.log('ℹ️ السيرفر لا يحتاج تجديد الآن');
        }

    } catch (err) {
        console.error('❌ حدث خطأ أثناء التحقق:', err);
    } finally {
        await browser.close();
    }
}

// تحقق كل 5 دقائق
cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 التحقق إذا السيرفر محتاج تجديد');
    await checkAndRenew();
});

// تشغيل أول مرة مباشرة
checkAndRenew();
