const mineflayer = require('mineflayer')
const express = require('express')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin

// ====== إعداد السيرفر ======
const serverHost = "GOLDEN-u8nn.aternos.me" // IP بتاع السيرفر
const serverPort = 23761                   // البورت

// أسماء البوتات
const botNames = ["GOOLDENBOT1", "GOOLDENBOT2", "GOOLDENBOT3"]

// رسائل عشوائية طبيعية زي البشر
const randomMessages = [
  "هاي 👋",
  "عاملين ايه؟ 😃",
  "لقيت دايموند 🔥",
  "عاش 👑",
  "بنيت بيت 🏠",
  "😂😂 انا تايه",
  "مين عنده اكل؟ 🍗",
  "في كهف مرعب هنا 😱",
  "يلا نبني قلعة 🏰",
  "ايه الاخبار يا شباب؟ 🙌"
]

// ====== إنشاء بوت مع خاصية Reconnect + حركة ذكية ======
function createBot(username) {
  let bot

  function startBot() {
    try {
      bot = mineflayer.createBot({
        host: serverHost,
        port: serverPort,
        username: username,
      })

      // تحميل الـ Plugins
      bot.loadPlugin(pathfinder)
      bot.loadPlugin(collectBlock)

      bot.once('spawn', () => {
        console.log(`✅ ${username} دخل السيرفر!`)

        const mcData = require('minecraft-data')(bot.version)
        const defaultMove = new Movements(bot, mcData)
        bot.pathfinder.setMovements(defaultMove)

        // حركة عشوائية كل 20 ثانية
        setInterval(() => {
          const x = bot.entity.position.x + (Math.random() * 20 - 10)
          const y = bot.entity.position.y
          const z = bot.entity.position.z + (Math.random() * 20 - 10)
          bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z))
        }, 20000)

        // يحاول يجمع خشب لو شافه
        setInterval(async () => {
          const oak = mcData.blocksByName.oak_log?.id
          if (!oak) return
          const block = bot.findBlock({ matching: oak, maxDistance: 16 })
          if (block) {
            console.log(`${username} 🌲 لقى خشب وبيجمعه`)
            try {
              await bot.collectBlock.collect(block)
            } catch (err) {
              console.log("❌ مش قادر يجيب الخشب:", err.message)
            }
          }
        }, 60000)

        // كلام عشوائي زي البشر
        setInterval(() => {
          const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
          bot.chat(msg)
        }, 15000 + Math.random() * 10000) // كل 15–25 ثانية
      })

      // لو حصل Error أو Disconnect → يعيد المحاولة بعد 30 ثانية
      bot.on('error', err => {
        console.log(`❌ Error ${username}:`, err)
      })

      bot.on('end', () => {
        console.log(`⚠️ ${username} خرج من السيرفر، هيعيد الدخول بعد 30 ثانية...`)
        setTimeout(startBot, 30000)
      })
    } catch (e) {
      console.log(`💥 Crash حصل مع ${username}:`, e)
      console.log("⏳ هيحاول يدخل تاني بعد 30 ثانية...")
      setTimeout(startBot, 30000)
    }
  }

  startBot()
}

// ====== تشغيل كل البوتات ======
botNames.forEach((name) => createBot(name))

// ====== Web Server للـ Railway ======
const app = express()
app.get('/', (req, res) => res.send('✅ Smart Minecraft Bots are running on Railway!'))
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Web server running (for Railway keep-alive)")
})

// ====== Anti-Crash عام ======
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason)
})
