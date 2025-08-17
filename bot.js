import mineflayer from "mineflayer";

// إعدادات السيرفر
const host = process.env.MC_HOST || "server.aternos.org"; // غير ده بـ IP السيرفر
const port = process.env.MC_PORT || 25565;

// أسماء البوتات
const botNames = ["GOOLDENBOT1", "GOOLDENBOT2", "GOOLDENBOT3"];

// رسايل عشوائية
const messages = [
  "هلا شباب 👋",
  "انا قاعد AFK 😂",
  "مين موجود؟",
  "🔥 السيرفر جامد",
  "😂😂😂"
];

// دالة لعمل بوت جديد
function createBot(name) {
  const bot = mineflayer.createBot({
    host,
    port,
    username: name, // اسم البوت
  });

  bot.once("spawn", () => {
    console.log(`✅ ${name} دخل السيرفر`);

    // حركة عشوائية
    setInterval(() => {
      const direction = ["forward", "back", "left", "right"];
      const move = direction[Math.floor(Math.random() * direction.length)];
      bot.setControlState(move, true);
      setTimeout(() => bot.setControlState(move, false), 2000);
    }, 5000);

    // يجري أحيانا
    setInterval(() => {
      bot.setControlState("sprint", true);
      setTimeout(() => bot.setControlState("sprint", false), 3000);
    }, 15000);

    // يقفز من وقت للتاني
    setInterval(() => {
      bot.setControlState("jump", true);
      setTimeout(() => bot.setControlState("jump", false), 1000);
    }, 10000);

    // يبعت رسايل عشوائية
    setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      bot.chat(msg);
    }, 20000);
  });

  bot.on("end", () => {
    console.log(`❌ ${name} خرج، بيحاول يدخل تاني...`);
    setTimeout(() => createBot(name), 5000);
  });

  bot.on("error", (err) => {
    console.log(`⚠️ ${name} حصل فيه Error:`, err.message);
  });
}

// إنشاء ٣ بوتات
botNames.forEach(createBot);
