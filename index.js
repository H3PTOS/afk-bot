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

// باسورد الأوامر
const BOT_PASSWORD = "7717"

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

// Cooldown system
let lastChat = 0
function canChat() {
  return Date.now() - lastChat > 25000 // 25 ثانية
}

// ====== إنشاء بوت مع خاصية Reconnect + ذكاء ======
function createBot(username) {
  let bot

  function startBot() {
    try {
      bot = mineflayer.createBot({
        host: serverHost,
        port: serverPort,
        username: username,
        version: "1.20.1" // ✅ نفس إصدار السيرفر
      })

      // تحميل الـ Plugins
      bot.loadPlugin(pathfinder)
      bot.loadPlugin(collectBlock)
      bot.loadPlugin(pvp)

      bot.once('spawn', () => {
        console.log(`✅ ${username} دخل السيرفر!`)
        bot.chat("✅ البوت شغال وجاهز!")

        const mcData = mcDataLoader(bot.version)
        const defaultMove = new Movements(bot, mcData)
        bot.pathfinder.setMovements(defaultMove)

        // دالة للكلام بأمان (مع كول داون)
        bot.safeChat = (msg) => {
          if (canChat()) {
            bot.chat(msg)
            lastChat = Date.now()
          }
        }

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

        // ====== يجمع خشب / دايموند / ايرون عشوائي ======
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

        // ====== كلام عشوائي زي البشر كل 30 ثانية ======
        setInterval(() => {
          if (canChat()) {
            const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
            bot.chat(msg)
            lastChat = Date.now()
          }
        }, 30000)

        // ====== ردود على كلام الناس ======
        bot.on('chat', async (player, message) => {
          if (player === bot.username) return
          const lowerMsg = message.toLowerCase()

          if (lowerMsg.includes("هاي")) bot.safeChat("هاي 🙋‍♂️")
          if (lowerMsg.includes("سلام")) bot.safeChat("تيت 👋")

          // ====== لو لاعب كتب "give me" ======
          if (lowerMsg.includes("give me")) {
            bot.safeChat(`تمام يا ${player} 😃 خد الحاجات اللي جمعتها`)
            const items = bot.inventory.items()
            for (const item of items) {
              try {
                await bot.tossStack(item)
              } catch (err) {
                console.log("❌ مش قادر ارمي الايتيم:", err.message)
              }
            }
          }

          // ====== BOTNAME get me <resource> <count> <password> ======
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " get me")) {
            const parts = lowerMsg.split(" ")
            const resource = parts[parts.length - 3]
            const count = parseInt(parts[parts.length - 2]) || 1
            const password = parts[parts.length - 1]

            if (password !== BOT_PASSWORD) {
              bot.safeChat(`❌ يا ${player}, الباسورد غلط! 📌 مثال: ${bot.username} get me wood 5 ${BOT_PASSWORD}`)
              return
            }

            let blockId = null
            if (resource === "wood") blockId = mcData.blocksByName.oak_log?.id
            if (resource === "diamond") blockId = mcData.blocksByName.diamond_ore?.id
            if (resource === "iron") blockId = mcData.blocksByName.iron_ore?.id

            if (!blockId) {
              bot.safeChat(`❌ مش فاهم يعني ايه ${resource}, جرب wood/iron/diamond`)
              return
            }

            bot.safeChat(`⛏️ حاضر يا ${player}, بجمع ${count} ${resource}!`)

            try {
              let collected = 0
              while (collected < count) {
                const block = bot.findBlock({ matching: blockId, maxDistance: 32 })
                if (!block) {
                  bot.safeChat(`⚠️ مش لاقي ${resource} كفاية, جمعت ${collected}/${count}`)
                  break
                }
                await bot.collectBlock.collect(block)
                collected++
              }

              const targetPlayer = bot.players[player]?.entity
              if (targetPlayer) {
                const goal = new goals.GoalNear(targetPlayer.position.x, targetPlayer.position.y, targetPlayer.position.z, 1)
                await bot.pathfinder.goto(goal)

                let given = 0
                for (const item of bot.inventory.items()) {
                  if (item.name.includes(resource) && given < count) {
                    await bot.tossStack(item)
                    given += item.count
                  }
                }
                bot.safeChat(`✅ خلصت يا ${player}, سلمتك ${resource}!`)
              } else {
                bot.safeChat(`❌ مش لاقيك يا ${player}, قربلي`)
              }
            } catch (err) {
              bot.safeChat("❌ حصل خطأ و مش قادر اجمع الحاجة")
              console.log(err)
            }
          }

          // ====== follow me ======
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " follow me")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) {
              bot.safeChat(`❌ يا ${player}, الباسورد غلط!`)
              return
            }
            const targetPlayer = bot.players[player]?.entity
            if (!targetPlayer) {
              bot.safeChat(`❌ مش لاقيك يا ${player}`)
              return
            }
            bot.safeChat(`👣 حاضر يا ${player}, جاي وراك!`)
            const goal = new goals.GoalFollow(targetPlayer, 1)
            bot.pathfinder.setGoal(goal, true)
          }

          // ====== stop follow ======
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " stop follow")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) {
              bot.safeChat(`❌ يا ${player}, الباسورد غلط!`)
              return
            }
            bot.pathfinder.setGoal(null)
            bot.safeChat(`🛑 تمام يا ${player}, وقفت المتابعة!`)
          }

          // ====== build tower ======
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " build tower")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
            bot.safeChat("🧱 ببني برج!")

            const block = bot.inventory.items().find(i => i.name.includes("block"))
            if (!block) return bot.safeChat("❌ ماعنديش بلوكات للبناء")

            ;(async () => {
              try {
                await bot.equip(block, 'hand')
                for (let i = 0; i < 10; i++) {
                  const pos = bot.entity.position.floored()
                  const blockBelow = bot.blockAt(pos.offset(0, -1, 0))
                  await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })
                  await new Promise(r => setTimeout(r, 500))
                }
                bot.safeChat("✅ خلصت البرج!")
              } catch (err) {
                bot.safeChat("❌ مش قادر ابني البرج")
                console.log(err)
              }
            })()
          }

          // ====== build house ======
          if (lowerMsg.startsWith(bot.username.toLowerCase() + " build house")) {
            const password = lowerMsg.split(" ").pop()
            if (password !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")

            bot.safeChat(`🏠 ببني بيت صغير!`)
            const block = bot.inventory.items().find(i => i.name.includes("block"))
            if (!block) return bot.safeChat("❌ ماعنديش بلوكات للبناء")

            ;(async () => {
              try {
                await bot.equip(block, 'hand')
                const pos = bot.entity.position.floored()

                // الحيطان (5x5 وارتفاع 4)
                for (let y = 0; y < 4; y++) {
                  for (let x = 0; x < 5; x++) {
                    for (let z = 0; z < 5; z++) {
                      if (x === 0 || x === 4 || z === 0 || z === 4) {
                        // يسيب باب (فراغ في الأمام)
                        if (z === 0 && (x === 2 || x === 3) && y < 2) continue
                        const target = bot.blockAt(pos.offset(x, y, z))
                        await bot.placeBlock(target, { x: 0, y: 1, z: 0 })
                        await new Promise(r => setTimeout(r, 300))
                      }
                    }
                  }
                }

                // السقف
                for (let x = 0; x < 5; x++) {
                  for (let z = 0; z < 5; z++) {
                    const target = bot.blockAt(pos.offset(x, 4, z))
                    await bot.placeBlock(target, { x: 0, y: 1, z: 0 })
                    await new Promise(r => setTimeout(r, 300))
                  }
                }

                bot.safeChat(`✅ خلصت البيت!`)
              } catch (err) {
                bot.safeChat("❌ حصل خطأ في بناء البيت")
                console.log(err)
              }
            })()
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
