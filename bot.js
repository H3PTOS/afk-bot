const mineflayer = require('mineflayer')
const express = require('express')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const pvp = require('mineflayer-pvp').plugin
const mcDataLoader = require('minecraft-data')

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

// ====== إنشاء بوت مع خاصية Reconnect + ذكاء ======
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
      bot.loadPlugin(pvp)

      bot.once('spawn', () => {
        console.log(`✅ ${username} دخل السيرفر!`)

        const mcData = mcDataLoader(bot.version)
        const defaultMove = new Movements(bot, mcData)
        bot.pathfinder.setMovements(defaultMove)

        // ====== يلبس أي درع موجود ======
        function equipArmor() {
          const armor = ['helmet', 'chestplate', 'leggings', 'boots']
          armor.forEach(slot => {
            const item = bot.inventory.items().find(i => i.name.includes(slot))
            if (item) bot.equip(item, slot).catch(() => {})
          })
        }
        setInterval(equipArmor, 10000)

        // ====== يهاجم الوحوش القريبة ======
        setInterval(() => {
          const mob = bot.nearestEntity(e => e.type === 'mob')
          if (mob) {
            const sword = bot.inventory.items().find(i => i.name.includes('sword'))
            if (sword) {
              bot.equip(sword, 'hand').then(() => {
                bot.pvp.attack(mob)
              }).catch(() => {})
            }
          }
        }, 5000)

        // ====== يتحرك عشوائي كل 20 ثانية ======
        setInterval(() => {
          const x = bot.entity.position.x + (Math.random() * 20 - 10)
          const y = bot.entity.position.y
          const z = bot.entity.position.z + (Math.random() * 20 - 10)
          bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z))
        }, 20000)

        // ====== يجمع خشب / دايموند ======
        setInterval(async () => {
          const targets = [
            mcData.blocksByName.oak_log?.id,
            mcData.blocksByName.diamond_ore?.id,
            mcData.blocksByName.iron_ore?.id
          ].filter(Boolean)

          const block = bot.findBlock({ matching: targets, maxDistance: 16 })
          if (block) {
            console.log(`${username} ⛏️ لقى ${block.name} وبيجمعه`)
            try {
              await bot.collectBlock.collect(block)
            } catch (err) {
              console.log("❌ مش قادر يجيب البلوك:", err.message)
            }
          }
        }, 60000)

        // ====== كلام عشوائي زي البشر ======
        setInterval(() => {
          const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
          bot.chat(msg)
        }, 15000 + Math.random() * 10000)

        // ====== ردود على كلام الناس ======
        bot.on('chat', async (player, message) => {
          if (player === bot.username) return

          if (message.toLowerCase().includes("هاي")) bot.chat("هاي 🙋‍♂️")
          if (message.toLowerCase().includes("سلام")) bot.chat("تيت 👋")

          // ====== لو لاعب كتب "give me" ======
          if (message.toLowerCase().includes("give me")) {
            bot.chat(`تمام يا ${player} 😃 خد الحاجات اللي جمعتها`)
            const items = bot.inventory.items()
            for (const item of items) {
              try {
                await bot.tossStack(item)
              } catch (err) {
                console.log("❌ مش قادر ارمي الايتيم:", err.message)
              }
            }
          }
        })
      })

      // ====== Error + Reconnect ======
      bot.on('error', err => {
        console.log(`❌ Error ${username}:`, err)
      })
      bot.on('end', () => {
        console.log(`⚠️ ${username} خرج من السيرفر، هيعيد الدخول بعد 30 ثانية...`)
        setTimeout(startBot, 30000)
      })
    } catch (e) {
      console.log(`💥 Crash حصل مع ${username}:`, e)
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
