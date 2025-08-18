const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const autoeat = require('mineflayer-auto-eat').plugin;

// إعدادات السيرفر
const serverHost = "GOLDEN-u8nn.aternos.me"; // غيره لو محتاج
const serverPort = 23761;

// 🟢 دالة توليد اسم عشوائي
function randomName() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  for (let i = 0; i < 8; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "Player_" + name;
}

// 🟢 دالة إنشاء بوت عادي
function createBot(host, port) {
  const name = randomName();
  const bot = mineflayer.createBot({
    host,
    port,
    username: name
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log(`[${name}] دخل السيرفر`);
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);
  });

  bot.on('end', () => {
    console.log(`[${name}] خرج.. هيجرب يدخل بعد دقيقة`);
    setTimeout(() => createBot(host, port), 60 * 1000);
  });

  bot.on('error', err => console.log(`[${name}] Error: ${err}`));
}

// 🟢 دالة إنشاء فارمر
function createFarmer(host, port) {
  const name = randomName();
  const bot = mineflayer.createBot({
    host,
    port,
    username: name
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(autoeat);

  bot.once('spawn', () => {
    console.log(`[${name}] دخل السيرفر كفارمر!`);
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

    // تفعيل الأكل الأوتوماتيك
    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: []
    };
  });

  bot.on('autoeat_started', () => {
    console.log(`[${name}] بدأ ياكل`);
  });

  bot.on('autoeat_stopped', () => {
    console.log(`[${name}] وقف أكل`);
  });

  bot.on('end', () => {
    console.log(`[${name}] خرج.. هيجرب يدخل بعد دقيقة`);
    setTimeout(() => createFarmer(host, port), 60 * 1000);
  });

  bot.on('error', err => console.log(`[${name}] Error: ${err}`));
}

// 🔥 تشغيل 3 بوتات عاديين + 1 فارمر
for (let i = 0; i < 3; i++) {
  setTimeout(() => createBot(serverHost, serverPort), i * 5000);
}

setTimeout(() => {
  createFarmer(serverHost, serverPort);
}, 3 * 5000 + 2000);
