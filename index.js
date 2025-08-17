const mineflayer = require('mineflayer')
const express = require('express')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const pvp = require('mineflayer-pvp').plugin
const mcDataLoader = require('minecraft-data')

// إعداد السيرفر
const serverHost = "GOLDEN-u8nn.aternos.me"
const serverPort = 23761

// أسماء البوتات
const botNames = ["GOOLDENBOT1", "GOOLDENBOT2", "GOOLDENBOT3"]

// باسورد الأوامر
const BOT_PASSWORD = "7717"

// رسائل عشوائية
const randomMessages = [
  "هاي 👋",
  "عاملين ايه؟ 😃",
  "لقيت دايموند 🔥",
  "😂😂 انا تايه",
  "مين عنده اكل؟ 🍗",
  "يلا نبني قلعة 🏰",
]

// كول داون للشات
let lastChat = 0
function canChat() {
  return Date.now() - lastChat > 45000
}

// ====== إنشاء بوت ======
function createBot(username) {
  let bot
  let cancelBuild = false

  function startBot() {
    bot = mineflayer.createBot({
      host: serverHost,
      port: serverPort,
      username: username,
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

      // safe chat
      bot.safeChat = (msg) => {
        if (canChat()) {
          bot.chat(msg)
          lastChat = Date.now()
        }
      }

      // equip armor
      function equipArmor() {
        const armorMap = {
          head: "helmet",
          torso: "chestplate",
          legs: "leggings",
          feet: "boots"
        }
        for (const slot in armorMap) {
          const item = bot.inventory.items().find(i => i.name.includes(armorMap[slot]))
          if (item) bot.equip(item, slot).catch(() => {})
        }
      }
      setInterval(equipArmor, 10000)

      // auto eat لو عنده أكل
      setInterval(() => {
        const food = bot.inventory.items().find(i => i.name.includes("bread") || i.name.includes("cooked"))
        if (food && bot.food < 18) {
          bot.equip(food, 'hand').then(() => bot.consume()).catch(() => {})
        }
      }, 8000)

      // pvp mobs
      setInterval(() => {
        const mob = bot.nearestEntity(e =>
          e.type === 'mob' &&
          ["zombie", "skeleton", "creeper", "spider"].includes(e.name)
        )
        if (mob) {
          const sword = bot.inventory.items().find(i => i.name.includes('sword'))
          if (sword) {
            bot.equip(sword, 'hand').then(() => {
              bot.pvp.attack(mob)
            }).catch(() => {})
          }
        }
      }, 5000)

      // move random
      setInterval(() => {
        const x = bot.entity.position.x + (Math.random() * 20 - 10)
        const y = bot.entity.position.y
        const z = bot.entity.position.z + (Math.random() * 20 - 10)
        bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z))
      }, 20000)

      // random chat
      setInterval(() => {
        if (canChat()) {
          const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
          bot.chat(msg)
          lastChat = Date.now()
        }
      }, 30000)

      // commands
      bot.on('chat', async (player, message) => {
        if (player === bot.username) return
        const lowerMsg = message.toLowerCase()

        // ردود
        if (lowerMsg.includes("هاي")) bot.safeChat("هاي 🙋‍♂️")
        if (lowerMsg.includes("سلام")) bot.safeChat("تيت 👋")

        // give me
        if (lowerMsg.startsWith(bot.username.toLowerCase() + " give me")) {
          const password = lowerMsg.split(" ").pop()
          if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")

          const targetPlayer = bot.players[player]?.entity
          if (!targetPlayer) return bot.safeChat(`❌ مش لاقيك يا ${player}`)

          bot.safeChat(`تمام يا ${player} 😃 جاي`)
          const goal = new goals.GoalNear(targetPlayer.position.x, targetPlayer.position.y, targetPlayer.position.z, 1)
          await bot.pathfinder.goto(goal)

          const items = bot.inventory.items()
          for (const item of items) {
            try {
              await bot.tossStack(item)
            } catch {}
          }
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
          bot.safeChat(`🛑 وقفت المتابعة!`)
        }

        // build tower
        if (lowerMsg.startsWith(bot.username.toLowerCase() + " build tower")) {
          const password = lowerMsg.split(" ").pop()
          if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
          bot.safeChat("🧱 ببني برج!")
          cancelBuild = false

          const block = bot.inventory.items().find(i => i.name.includes("block"))
          if (!block) return bot.safeChat("❌ ماعنديش بلوكات للبناء")

          ;(async () => {
            try {
              await bot.equip(block, 'hand')
              for (let i = 0; i < 10; i++) {
                if (cancelBuild) break
                const pos = bot.entity.position.floored()
                const blockBelow = bot.blockAt(pos.offset(0, -1, 0))
                await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })
                await new Promise(r => setTimeout(r, 500))
              }
              bot.safeChat("✅ خلصت البرج!")
            } catch {}
          })()
        }

        // build house
        if (lowerMsg.startsWith(bot.username.toLowerCase() + " build house")) {
          const password = lowerMsg.split(" ").pop()
          if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
          bot.safeChat("🏠 ببني بيت!")
          cancelBuild = false

          const block = bot.inventory.items().find(i => i.name.includes("block"))
          if (!block) return bot.safeChat("❌ ماعنديش بلوكات للبناء")

          ;(async () => {
            try {
              await bot.equip(block, 'hand')
              const pos = bot.entity.position.floored()
              for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 5; x++) {
                  for (let z = 0; z < 5; z++) {
                    if (cancelBuild) break
                    if (x === 0 || x === 4 || z === 0 || z === 4) {
                      if (z === 0 && (x === 2 || x === 3) && y < 2) continue
                      const target = bot.blockAt(pos.offset(x, y, z))
                      await bot.placeBlock(target, { x: 0, y: 1, z: 0 })
                      await new Promise(r => setTimeout(r, 300))
                    }
                  }
                }
              }
              if (!cancelBuild) {
                for (let x = 0; x < 5; x++) {
                  for (let z = 0; z < 5; z++) {
                    if (cancelBuild) break
                    const target = bot.blockAt(pos.offset(x, 4, z))
                    await bot.placeBlock(target, { x: 0, y: 1, z: 0 })
                    await new Promise(r => setTimeout(r, 300))
                  }
                }
              }
              bot.safeChat("✅ خلصت البيت!")
            } catch {}
          })()
        }

        // stop build
        if (lowerMsg.startsWith(bot.username.toLowerCase() + " stop build")) {
          const password = lowerMsg.split(" ").pop()
          if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
          cancelBuild = true
          bot.pathfinder.setGoal(null)
          bot.safeChat(`🛑 وقفت البناء!`)
        }
      })
    })

    bot.on('error', err => console.log(`❌ Error ${username}:`, err))
    bot.on('end', () => {
      console.log(`⚠️ ${username} خرج، هيعيد الدخول بعد 30 ثانية...`)
      setTimeout(startBot, 30000)
    })
  }

  startBot()
}

// شغل البوتات كلها
botNames.forEach(name => createBot(name))

// Web server
const app = express()
app.get('/', (req, res) => res.send('✅ Smart Minecraft Bots are running!'))
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Web server running")
})

// Anti-Crash
process.on('uncaughtException', err => console.error('💥 Uncaught Exception:', err))
process.on('unhandledRejection', (reason) => console.error('💥 Unhandled Rejection:', reason))
