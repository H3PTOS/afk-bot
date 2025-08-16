const mineflayer = require('mineflayer')
const express = require('express')

// ====== إعداد السيرفر ======
const serverHost = "GOLDEN-u8nn.aternos.me" // IP بتاع السيرفر
const serverPort = 23761                   // البورت

// أسماء البوتات
const botNames = ["GOOLDENBOT1", "GOOLDENBOT2", "GOOLDENBOT3"]

// رسائل البوتات
const messages = [
  "هاي 👋",
  "عاملين ايه؟ 😃",
  "لقيت دايموند 🔥",
  "عاش 👑",
  "بنيت بيت 🏠"
]

// ====== إنشاء بوت مع خاصية الـ Reconnect ======
function createBot(username, index) {
  let bot

  function startBot() {
    try {
      bot = mineflayer.createBot({
        host: serverHost,
        port: serverPort,
        username: username,
      })

      bot.on('spawn', () => {
        console.log(`✅ ${username} دخل السيرفر!`)

        // حركة عشوائية كل 5 ثواني
        setInterval(() => {
          const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak']
          const action = actions[Math.floor(Math.random() * actions.length)]

          if (action === 'jump') {
            bot.setControlState('jump', true)
            setTimeout(() => bot.setControlState('jump', false), 500)
          } else if (action === 'sneak') {
            bot.setControlState('sneak', true)
            setTimeout(() => bot.setControlState('sneak', false), 2000)
          } else {
            bot.setControlState(action, true)
            setTimeout(() => bot.setControlState(action, false), 2000)
          }
        }, 5000)

        // الكلام بين البوتات
        setTimeout(() => chatLoop(bot, index), 10000)
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

// ====== وظيفة الكلام ======
function chatLoop(bot, index) {
  let msgIndex = 0
  setInterval(() => {
    bot.chat(messages[msgIndex])
    msgIndex = (msgIndex + 1) % messages.length
  }, (botNames.length * 20000))

  setTimeout(() => {
    bot.chat(messages[0])
  }, index * 20000)
}

// ====== تشغيل كل البوتات ======
botNames.forEach((name, i) => createBot(name, i))

// ====== Web Server للـ Railway ======
const app = express()
app.get('/', (req, res) => res.send('✅ Minecraft AFK Bot is running on Railway!'))
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Web server running (for Railway keep-alive)")
})

// ====== Anti-Crash عام لكل المشروع ======
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason)
})
