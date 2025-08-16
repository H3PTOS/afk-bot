const mineflayer = require('mineflayer')
const express = require('express')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const pvp = require('mineflayer-pvp').plugin
const mcDataLoader = require('minecraft-data')

// ====== إعداد السيرفر ======
const serverHost = "GOLDEN-u8nn.aternos.me" // IP
const serverPort = 23761                   // Port

// أسماء البوتات
const botNames = ["GOOLDENBOT1", "GOOLDENBOT2", "GOOLDENBOT3"]

// باسورد الأوامر
const BOT_PASSWORD = "7717"

// رسائل عشوائية
const randomMessages = [
  "هاي 👋", "عاملين ايه؟ 😃", "لقيت دايموند 🔥", "عاش 👑",
  "😂😂 انا تايه", "مين عنده اكل؟ 🍗", "في كهف مرعب هنا 😱",
  "يلا نبني قلعة 🏰", "ايه الاخبار يا شباب؟ 🙌"
]

// ====== Cooldown للكلام ======
let lastChat = 0
function canChat() {
  return Date.now() - lastChat > 45000 // 45 ثانية
}

// ====== إنشاء بوت ======
function createBot(username) {
  let bot
  let stopBuilding = false

  function startBot() {
    try {
      bot = mineflayer.createBot({
        host: serverHost,
        port: serverPort,
        username,
        version: "1.20.1"
      })

      bot.loadPlugin(pathfinder)
      bot.loadPlugin(collectBlock)
      bot.loadPlugin(pvp)

      bot.once('spawn', () => {
        console.log(`✅ ${username} دخل السيرفر!`)
        bot.chat("✅ البوت شغال وجاهز!")

        const mcData = mcDataLoader(bot.version)
        const defaultMove = new Movements(bot, mcData)
        bot.pathfinder.setMovements(defaultMove)

        bot.safeChat = (msg) => {
          if (canChat()) {
            bot.chat(msg)
            lastChat = Date.now()
          }
        }

        // ====== يلبس دروع ======
        function equipArmor() {
          const armor = ['helmet', 'chestplate', 'leggings', 'boots']
          armor.forEach(slot => {
            const item = bot.inventory.items().find(i => i.name.includes(slot))
            if (item) bot.equip(item, slot).catch(() => {})
          })
        }
        setInterval(equipArmor, 10000)

        // ====== يهاجم وحوش ======
        setInterval(() => {
          const mob = bot.nearestEntity(e => e.type === 'mob')
          if (mob) {
            const sword = bot.inventory.items().find(i => i.name.includes('sword'))
            if (sword) {
              bot.equip(sword, 'hand').then(() => bot.pvp.attack(mob)).catch(() => {})
            }
          }
        }, 5000)

        // ====== ياكل ======
        setInterval(async () => {
          if (bot.food < 16) {
            const food = bot.inventory.items().find(i => i.name.includes('bread') || i.name.includes('cooked'))
            if (food) {
              try {
                await bot.equip(food, 'hand')
                await bot.consume()
              } catch {}
            }
          }
        }, 8000)

        // ====== يتحرك عشوائي ======
        setInterval(() => {
          const x = bot.entity.position.x + (Math.random() * 20 - 10)
          const y = bot.entity.position.y
          const z = bot.entity.position.z + (Math.random() * 20 - 10)
          bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z))
        }, 20000)

        // ====== كلام عشوائي ======
        setInterval(() => {
          if (canChat()) {
            const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
            bot.chat(msg)
            lastChat = Date.now()
          }
        }, 45000)

        // ====== أوامر الشات ======
        bot.on('chat', async (player, message) => {
          if (player === bot.username) return
          const lowerMsg = message.toLowerCase()

          // تحيات
          if (lowerMsg.includes("هاي")) bot.safeChat("هاي 🙋‍♂️")
          if (lowerMsg.includes("سلام")) bot.safeChat("تيت 👋")

          // stop build
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " stop build")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
            stopBuilding = true
            bot.safeChat("🛑 وقفت البناء")
            return
          }

          // follow me
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " follow me")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
            const targetPlayer = bot.players[player]?.entity
            if (!targetPlayer) return bot.safeChat(`❌ مش لاقيك يا ${player}`)
            bot.safeChat(`👣 حاضر يا ${player}, جاي وراك!`)
            const goal = new goals.GoalFollow(targetPlayer, 1)
            bot.pathfinder.setGoal(goal, true)
          }

          // stop follow
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " stop follow")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
            bot.pathfinder.setGoal(null)
            bot.safeChat(`🛑 تمام يا ${player}, وقفت المتابعة!`)
          }

          // give me
          if (lowerMsg.startsWith("give me")) {
            const parts = lowerMsg.split(" ")
            const itemName = parts[2]
            const count = parseInt(parts[3]) || 1
            const password = parts[4]
            if (password !== BOT_PASSWORD) return bot.safeChat(`❌ باسورد غلط يا ${player}`)

            const targetPlayer = bot.players[player]?.entity
            if (!targetPlayer) return bot.safeChat(`❌ مش لاقيك يا ${player}`)

            bot.safeChat(`🎁 جايبلك ${count} ${itemName}`)

            let given = 0
            for (const item of bot.inventory.items()) {
              if (item.name.includes(itemName) && given < count) {
                await bot.tossStack(item)
                given += item.count
              }
            }
          }

          // build tower
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " build tower")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
            stopBuilding = false
            bot.safeChat("🧱 ببني برج!")
            const block = bot.inventory.items().find(i => i.name.includes("block"))
            if (!block) return bot.safeChat("❌ مفيش بلوكات للبناء")

            ;(async () => {
              try {
                await bot.equip(block, 'hand')
                for (let i = 0; i < 10; i++) {
                  if (stopBuilding) break
                  const pos = bot.entity.position.floored()
                  const blockBelow = bot.blockAt(pos.offset(0, -1, 0))
                  await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })
                  await new Promise(r => setTimeout(r, 500))
                }
                bot.safeChat("✅ خلصت البرج!")
              } catch (err) {
                bot.safeChat("❌ مش قادر ابني برج")
              }
            })()
          }

          // build house
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " build house")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
            stopBuilding = false
            bot.safeChat("🏠 ببني بيت صغير!")
            const block = bot.inventory.items().find(i => i.name.includes("block"))
            if (!block) return bot.safeChat("❌ مفيش بلوكات")

            ;(async () => {
              try {
                await bot.equip(block, 'hand')
                const pos = bot.entity.position.floored()
                for (let y = 0; y < 4; y++) {
                  for (let x = 0; x < 5; x++) {
                    for (let z = 0; z < 5; z++) {
                      if (stopBuilding) return
                      if (x === 0 || x === 4 || z === 0 || z === 4) {
                        if (z === 0 && (x === 2 || x === 3) && y < 2) continue
                        const target = bot.blockAt(pos.offset(x, y, z))
                        await bot.placeBlock(target, { x: 0, y: 1, z: 0 })
                        await new Promise(r => setTimeout(r, 300))
                      }
                    }
                  }
                }
                bot.safeChat("✅ خلصت البيت!")
              } catch {
                bot.safeChat("❌ فشل بناء البيت")
              }
            })()
          }
        })
      })

      bot.on('error', err => console.log(`❌ Error ${username}:`, err))
      bot.on('end', () => {
        console.log(`⚠️ ${username} خرج, هيعيد الدخول بعد 30 ثانية...`)
        setTimeout(startBot, 30000)
      })
    } catch (e) {
      console.log(`💥 Crash مع ${username}:`, e)
      setTimeout(startBot, 30000)
    }
  }

  startBot()
}

// ====== شغل كل البوتات ======
botNames.forEach(name => createBot(name))

// ====== Web Server ======
const app = express()
app.get('/', (req, res) => res.send('✅ Smart Minecraft Bots are running!'))
app.listen(process.env.PORT || 3000, () => console.log("🌍 Web server running"))

// ====== Anti-Crash ======
process.on('uncaughtException', err => console.error('💥 Uncaught Exception:', err))
process.on('unhandledRejection', reason => console.error('💥 Unhandled Rejection:', reason))
