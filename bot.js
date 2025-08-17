import mineflayer from "mineflayer";

// السيرفر (Cracked Aternos)
const host = "GOLDEN-u8nn.aternos.me";
const port = 23761;

function createBot(username) {
  const bot = mineflayer.createBot({
    host,
    port,
    username,
  });

  bot.on("login", () => {
    console.log(`✅ ${username} دخل السيرفر`);
  });

  bot.on("end", () => {
    console.log(`❌ ${username} خرج، بيحاول يدخل تاني...`);
    setTimeout(() => createBot(username), 5000); // يدخل تاني بعد 5 ثواني
  });

  bot.on("error", (err) => {
    console.log(`⚠️ ${username} حصل فيه Error: ${err.message}`);
  });

  // رسائل عشوائية
  const msgs = ["أنا هنا ✨", "مش AFK 😎", "GoldenBots Online 💛", "يلا نلعب 🎮"];
  setInterval(() => {
    if (bot.player) {
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      bot.chat(msg);
    }
  }, 60000); // كل دقيقة
}

// إنشاء ٣ بوتات
createBot("GOOLDENBOT1");
createBot("GOOLDENBOT2");
createBot("GOOLDENBOT3");
