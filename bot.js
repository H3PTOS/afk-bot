import mineflayer from "mineflayer";
import 'dotenv/config';

const host = process.env.MC_HOST;
const port = parseInt(process.env.MC_PORT);

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

  // يبعت رسائل عشوائية كل شوية
  const msgs = ["أنا هنا ✨", "مش AFK 😎", "GoldenBots Online 💛", "يلا نلعب 🎮"];
  setInterval(() => {
    if (bot.player) {
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      bot.chat(msg);
    }
  }, 60000); // كل دقيقة
}

// البوتات
createBot("GOOLDENBOT1");
createBot("GOOLDENBOT2");
createBot("GOOLDENBOT3");
