import mineflayer from "mineflayer";
import { pathfinder, Movements, goals } from "mineflayer-pathfinder";
import { GoalNear } from "mineflayer-pathfinder";

// بيانات السيرفر (Cracked Aternos)
const host = "GOLDEN-u8nn.aternos.me";
const port = 23761;

// رسائل شات عشوائية
const msgs = ["أنا هنا ✨", "مش AFK 😎", "GoldenBots Online 💛", "يلا نلعب 🎮"];

// تحريك البوت عشوائياً
function addRandomMovement(bot) {
  bot.loadPlugin(pathfinder);
  const mcData = require("minecraft-data")(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);

  setInterval(() => {
    if (!bot.player || !bot.entity) return;

    const x = bot.entity.position.x + (Math.random() * 4 - 2);
    const z = bot.entity.position.z + (Math.random() * 4 - 2);
    const y = bot.entity.position.y;

    bot.pathfinder.setGoal(new GoalNear(x, y, z, 1));
  }, 45000); // كل 45 ثانية
}

// إنشاء بوت
function createBot(username) {
  const bot = mineflayer.createBot({
    host,
    port,
    username,
  });

  bot.on("login", () => {
    console.log(`✅ ${username} دخل السيرفر`);

    // رسائل عشوائية كل دقيقة
    setInterval(() => {
      if (bot.player) {
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        bot.chat(msg);
      }
    }, 60000);

    // حركة
    addRandomMovement(bot);
  });

  bot.on("end", () => {
    console.log(`❌ ${username} خرج، بيحاول يدخل تاني...`);
    setTimeout(() => createBot(username), 5000); // يعيد الدخول بعد 5 ثواني
  });

  bot.on("error", (err) => {
    if (err.message.includes("ECONNREFUSED") || err.message.includes("Timed out")) {
      console.log(`⚠️ ${username} السيرفر مش متاح حالياً.`);
    } else {
      console.log(`⚠️ ${username} حصل فيه Error: ${err.message}`);
    }
  });
}

// تشغيل 3 بوتات مع تأخير بسيط بين كل واحد
setTimeout(() => createBot("GOOLDENBOT1"), 0);
setTimeout(() => createBot("GOOLDENBOT2"), 5000);
setTimeout(() => createBot("GOOLDENBOT3"), 10000);
