// جدولة كل 5 دقائق
cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 التحقق إذا السيرفر محتاج تجديد');
    await checkAndRenew();
});

async function checkAndRenew() {
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

        // تحقق إذا فيه زر Renew
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
