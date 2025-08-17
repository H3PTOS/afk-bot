// =======================
// Minecraft Super Bot v1
// =======================
// مطور: النسخة الطويلة المعدلة
// الأوامر: حراسة، دورية، كسر، بناء، استخدام شيمات، رد ذكي
// =======================

// استدعاء المكتبات
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const armorManager = require('mineflayer-armor-manager');
const autoeat = require('mineflayer-auto-eat').plugin;
const { Vec3 } = require('vec3');
const fs = require('fs');
const chalk = require('chalk');

// أسماء البوتات (ممكن تزودها)
const botNames = ['Bot_Alpha', 'Bot_Beta'];

// إعدادات الاتصال
const server = {
  host: "localhost", // غيرها حسب السيرفر
  port: 25565,
  version: false
};

// دالة تشغيل البوت
function createBot(username) {
  const bot = mineflayer.createBot({
    host: server.host,
    port: server.port,
    username: username,
    version: server.version
  });

  // تحميل البلجنات
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(autoeat);

  // عند تسجيل الدخول
  bot.once('spawn', () => {
    console.log(chalk.green(`✅ ${username} دخل السيرفر!`));
    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: []
    };
  });

  // رسائل الشات
  bot.on('chat', async (usernameSender, message) => {
    if (usernameSender === bot.username) return;

    const msg = message.toLowerCase();

    // رد ذكي
    if (msg.includes("سلام")) {
      bot.chat(`وعليكم السلام يا ${usernameSender} 🫡`);
    }
    if (msg.includes("ازيك")) {
      bot.chat(`الحمدلله تمام، وانت عامل ايه يا ${usernameSender}? 😎`);
    }

    // أمر حراسة
    if (msg.startsWith("حراسة")) {
      const target = bot.players[usernameSender]?.entity;
      if (!target) return bot.chat("❌ مش شايفك!");
      bot.chat(`🛡️ حاضر يا ${usernameSender}، هحرسك`);
      startGuard(bot, target);
    }

    // أمر توقف
    if (msg.startsWith("وقف")) {
      stopGuard();
      stopPatrol();
      bot.chat("⛔ وقفت كل الأوامر!");
    }

    // أمر قتل وحوش
    if (msg.startsWith("اقتل")) {
      huntMobs(bot);
      bot.chat("⚔️ حاضر، هقتل الوحوش القريبة");
    }

    // أمر كسر
    if (msg.startsWith("اكسر")) {
      const blockName = msg.split(" ")[1];
      if (!blockName) return bot.chat("اكتب اسم البلوك!");
      breakBlock(bot, blockName);
    }

    // أمر تسوية الأرض 80x80
    if (msg.startsWith("سطح")) {
      bot.chat("🛠️ هبدأ تسوية الأرض 80x80 استنى...");
      flattenArea(bot, 80);
    }
  });

  // حدث الخطأ
  bot.on('error', err => console.log(chalk.red(`❌ Error: ${err}`)));
  bot.on('end', () => {
    console.log(chalk.yellow(`⚠️ ${username} خرج!`));
    setTimeout(() => createBot(username), 10000);
  });

  // === دوال المساعدة ===
  let guard = null;

  function startGuard(bot, entity) {
    guard = entity;
    moveToGuard();
  }

  function stopGuard() {
    guard = null;
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
  }

  async function moveToGuard() {
    if (!guard) return;
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new goals.GoalFollow(guard, 2), true);
    setTimeout(moveToGuard, 1000);
  }

  function huntMobs(bot) {
    const mob = bot.nearestEntity(e => e.type === 'mob');
    if (mob) {
      bot.chat("🎯 لقيت وحش! هجري عليه");
      bot.pvp.attack(mob);
    } else {
      bot.chat("مفيش وحوش قريبة!");
    }
  }

  async function breakBlock(bot, blockName) {
    const target = bot.findBlock({
      matching: block => block.name === blockName,
      maxDistance: 32
    });
    if (!target) return bot.chat("❌ مش لاقي البلوك!");
    const tool = bot.pathfinder.bestHarvestTool(target);
    try {
      await bot.tool.equip(tool, 'hand');
      await bot.dig(target);
      bot.chat(`✅ كسرت ${blockName}`);
    } catch (err) {
      bot.chat("❌ معرفتش اكسر البلوك!");
    }
  }

  async function flattenArea(bot, size) {
    const half = Math.floor(size / 2);
    const base = bot.entity.position.clone().offset(-half, -1, -half);

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const pos = base.offset(x, 0, z);
        const block = bot.blockAt(pos);
        if (block && block.name !== "air") {
          try {
            await bot.dig(block);
          } catch (err) {
            console.log("Dig error:", err.message);
          }
        }
      }
    }
    bot.chat("✅ خلصت تسوية الأرض!");
  }

  return bot;
}

// شغل كل البوتات
botNames.forEach(name => createBot(name));
// =======================
// جزء 2 : أوامر متقدمة + شيمات
// =======================

// تحميل الشيمات (schematic / litematic)
const { Schematic } = require('prismarine-schematic');
const { Vec3: Vec } = require('vec3');

// تحميل ملفات من فولدر schematics
function loadSchematic(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return Schematic.read(buffer, bot.version);
  } catch (err) {
    console.log(chalk.red("❌ خطأ تحميل الشيمات:"), err);
    return null;
  }
}

// بناء شيمات
async function buildSchematic(bot, filePath) {
  const schematic = loadSchematic(filePath);
  if (!schematic) {
    bot.chat("❌ معرفتش افتح الملف");
    return;
  }

  bot.chat("📐 هبدأ البناء...");
  const origin = bot.entity.position.floored();

  for (let x = 0; x < schematic.size.x; x++) {
    for (let y = 0; y < schematic.size.y; y++) {
      for (let z = 0; z < schematic.size.z; z++) {
        const block = schematic.getBlock(new Vec(x, y, z));
        if (!block || block.name === "air") continue;

        const pos = origin.offset(x, y, z);
        const target = bot.blockAt(pos);

        if (target && target.name !== "air" && target.name !== block.name) {
          try {
            await bot.dig(target);
          } catch {}
        }

        if (!target || target.name === "air") {
          try {
            await bot.placeBlock(bot.inventory.items()[0], new Vec(0, 1, 0));
          } catch {}
        }
      }
    }
  }
  bot.chat("✅ خلصت البناء!");
}

// أوامر مخصصة للبنايات
function registerBuildingCommands(bot) {
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;

    if (message.startsWith("بني")) {
      const args = message.split(" ");
      const name = args[1];
      if (!name) return bot.chat("اكتب اسم البنايه!");

      const filePath = `./schematics/${name}.schematic`;
      if (!fs.existsSync(filePath)) {
        bot.chat("❌ مش لاقي الشيمه!");
        return;
      }
      await buildSchematic(bot, filePath);
    }

    if (message.startsWith("احتياجات")) {
      const args = message.split(" ");
      const name = args[1];
      if (!name) return bot.chat("❌ اكتب اسم البنايه!");

      const filePath = `./schematics/${name}.schematic`;
      if (!fs.existsSync(filePath)) {
        bot.chat("❌ الملف مش موجود!");
        return;
      }

      const schematic = loadSchematic(filePath);
      if (!schematic) return bot.chat("❌ معرفتش اقرأ الملف!");

      const needed = {};
      for (let x = 0; x < schematic.size.x; x++) {
        for (let y = 0; y < schematic.size.y; y++) {
          for (let z = 0; z < schematic.size.z; z++) {
            const block = schematic.getBlock(new Vec(x, y, z));
            if (!block || block.name === "air") continue;
            needed[block.name] = (needed[block.name] || 0) + 1;
          }
        }
      }

      bot.chat("📦 محتاجين للبنايه:");
      for (const [block, count] of Object.entries(needed)) {
        bot.chat(`- ${block}: ${count}`);
      }
    }
  });
}
// =======================
// جزء 3 : الدوريات + الحماية + الفلاحة
// =======================

// دوريات حوالين المنطقة
function startPatrol(bot, center, radius = 10) {
  bot.chat("🚶‍♂️ هبدأ اللف حوالين المنطقه");
  let angle = 0;

  setInterval(async () => {
    try {
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius;
      const y = bot.entity.position.y;
      angle += Math.PI / 4;

      await bot.pathfinder.goto(new goals.GoalBlock(x, y, z));
    } catch (err) {
      console.log("⚠️ خطأ في الدوريات:", err);
    }
  }, 15000); // كل 15 ثانيه يتحرك
}

// أمر لحماية المنطقة
function registerGuard(bot) {
  let guarding = false;
  let center = null;

  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    if (message === "guard on") {
      guarding = true;
      center = bot.entity.position.clone();
      bot.chat("🛡️ البوت بيحمي المنطقه دلوقتي");
      startPatrol(bot, center, 8);
    }

    if (message === "guard off") {
      guarding = false;
      bot.chat("❌ وقفت الحماية");
    }
  });

  bot.on("physicTick", () => {
    if (!guarding) return;

    const mob = bot.nearestEntity(e => e.type === "mob");
    if (mob) {
      bot.pvp.attack(mob);
    }
  });
}

// =======================
// جزء 4 : الفلاحة والزراعة
// =======================

async function autoFarm(bot) {
  bot.chat("🌱 هبدأ الزراعة...");

  const mcData = require("minecraft-data")(bot.version);
  const wheatSeed = bot.inventory.items().find(item => item.name.includes("seeds"));

  if (!wheatSeed) {
    bot.chat("❌ مفيش بذور!");
    return;
  }

  const farmland = bot.findBlock({
    matching: block => block.name.includes("farmland"),
    maxDistance: 32,
  });

  if (!farmland) {
    bot.chat("❌ مش لاقي farmland");
    return;
  }

  try {
    await bot.pathfinder.goto(new goals.GoalBlock(farmland.position.x, farmland.position.y, farmland.position.z));
    await bot.equip(wheatSeed, "hand");
    await bot.placeBlock(farmland, new Vec(0, 1, 0));
    bot.chat("✅ زرعت بذرة");
  } catch (err) {
    console.log("⚠️ خطأ في الزراعة:", err);
  }
}

function registerFarming(bot) {
  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    if (message === "farm") {
      await autoFarm(bot);
    }
  });
}
// ======================= index.js (FINAL COMPACT) =======================
// Core deps
const mineflayer = require('mineflayer')
const express = require('express')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalBlock, GoalNear, GoalFollow } = goals
const collectBlock = require('mineflayer-collectblock').plugin
const pvp = require('mineflayer-pvp').plugin
const mcDataLoader = require('minecraft-data')

// ========= Server config =========
const serverHost = "GOLDEN-u8nn.aternos.me"
const serverPort = 23761

// ========= Bots =========
const botNames = ["GOOLDENBOT1", "GOOLDENBOT2", "GOOLDENBOT3"]

// ========= Security =========
const BOT_PASSWORD = "7717"

// ========= Random chat =========
const randomMessages = [
  "هاي 👋",
  "عاملين ايه؟ 😃",
  "لقيت دايموند 🔥",
  "😂😂 انا تايه",
  "مين عنده اكل؟ 🍗",
  "يلا نبني قلعة 🏰",
  "هحرس المكان شوية 🛡️",
  "حد محتاج موارد؟ ⛏️"
]

// ========= Chat cooldown =========
let lastChat = 0
const CHAT_COOLDOWN_MS = 45000
function canChat () { return Date.now() - lastChat > CHAT_COOLDOWN_MS }

// ========= Helpers (general) =========
function smartReply(text) {
  const t = text.toLowerCase()
  if (t.includes('سلام') || t.includes('hi') || t.includes('hello')) return "هاي 👋"
  if (t.includes('شكرا') || t.includes('thx') || t.includes('thanks')) return "العفو 💛"
  if (t.includes('فينك') || t.includes('where')) return "انا شغال حوالين المكان، قول follow me + الباسورد وهاجي 🏃‍♂️"
  if (t.includes('جوعان') || t.includes('اكل')) return "لو معايا أكل هستهلك، ولو محتاج اديني أمر gather wood وهظبطك 🍞"
  if (t.includes('خطر') || t.includes('mob')) return "لو ظهر زومبي/سكيليتون/كريبر/سبايدر ههجم عليهم تلقائيًا بسيف 🗡️"
  return null
}

function delay(ms){ return new Promise(r=>setTimeout(r, ms)) }

// ========= Create bot =========
function createBot(username) {
  let bot
  let cancelBuildOrTask = false
  let patrolTimer = null
  let guardTimer = null
  let randomWalkTimer = null
  let talkTimer = null
  let combatTimer = null
  let autoEatTimer = null

  function safeClear(t) { if (t) clearInterval(t) }

  function startBot() {
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
      const mcData = mcDataLoader(bot.version)
      const defaultMove = new Movements(bot, mcData)
      defaultMove.allow1by1towers = true
      defaultMove.canDig = true
      bot.pathfinder.setMovements(defaultMove)

      console.log(`✅ ${username} دخل السيرفر!`)
      bot.chat("✅ البوت شغال وجاهز!")

      // ===== Safe chat wrapper
      bot.safeChat = (msg) => {
        if (canChat()) { bot.chat(msg); lastChat = Date.now() }
      }

      // ===== Auto-equip armor
      function equipArmor() {
        const slots = [
          ['helmet','head'],
          ['chestplate','torso'],
          ['leggings','legs'],
          ['boots','feet']
        ]
        for (const [pattern, slot] of slots) {
          const item = bot.inventory.items().find(i => i.name.includes(pattern))
          if (item) bot.equip(item, slot).catch(()=>{})
        }
      }
      setInterval(equipArmor, 10000)

      // ===== Loot armor dropped on ground
      bot.on('entitySpawn', (entity) => {
        // Item entity metadata varies by version; safe-check the name if we can
        if (entity.kind === 'Drops' || entity.objectType === 'Item') {
          try {
            const stack = entity?.metadata?.[7]?.itemId || entity?.metadata?.[8]?.itemId
            if (!stack) return
            const name = mcData.items[stack]?.name || ""
            if (/(helmet|chestplate|leggings|boots)/i.test(name)) {
              bot.pathfinder.setGoal(new GoalNear(entity.position.x, entity.position.y, entity.position.z, 1))
            }
          } catch {}
        }
      })

      // ===== Auto eat
      autoEatTimer = setInterval(() => {
        if (bot.food < 14) {
          const food = bot.inventory.items().find(i =>
            i.name.includes("bread") || i.name.includes("apple") || i.name.includes("cooked")
          )
          if (food) {
            bot.equip(food, 'hand')
              .then(()=> bot.consume().catch(()=>{}))
              .catch(()=>{})
          }
        }
      }, 8000)

      // ===== Tool selection by block type
      function selectBestToolForBlock(block) {
        if (!block) return null
        const name = block.name || ""
        // simple heuristics:
        if (/log|wood|stem|hyphae/.test(name)) {
          return bot.inventory.items().find(i => /axe/.test(i.name)) || null
        }
        if (/dirt|grass|sand|gravel|clay/.test(name)) {
          return bot.inventory.items().find(i => /shovel/.test(i.name)) || null
        }
        // default: stone-like
        return bot.inventory.items().find(i => /pickaxe/.test(i.name)) || null
      }

      async function breakBlockAt(pos) {
        const block = bot.blockAt(pos)
        if (!block || !bot.canDigBlock(block)) return false
        const tool = selectBestToolForBlock(block)
        try {
          if (tool) await bot.equip(tool, 'hand')
        } catch {}
        try {
          await bot.dig(block)
          return true
        } catch {
          return false
        }
      }

      // ===== Combat loop (smart + creeper distance)
      function getNearestHostile() {
        return bot.nearestEntity(e =>
          e.type === 'mob' && ['zombie','skeleton','creeper','spider'].includes(e.name)
        )
      }

      combatTimer = setInterval(async () => {
        const target = getNearestHostile()
        if (!target) return

        // avoid creeper blast
        if (target.name === 'creeper') {
          const dist = bot.entity.position.distanceTo(target.position)
          if (dist < 4) {
            // back off a bit
            const dx = bot.entity.position.x - target.position.x
            const dz = bot.entity.position.z - target.position.z
            const away = new GoalBlock(
              bot.entity.position.x + (dx > 0 ? 3 : -3),
              bot.entity.position.y,
              bot.entity.position.z + (dz > 0 ? 3 : -3)
            )
            bot.pathfinder.setGoal(away)
            return
          }
        }

        const sword = bot.inventory.items().find(i => i.name.includes('sword'))
        if (sword) {
          try { await bot.equip(sword, 'hand') } catch {}
          try { bot.pvp.attack(target) } catch {}
        }
      }, 1500)

      // ===== Random walk (to avoid AFK)
      randomWalkTimer = setInterval(() => {
        const x = bot.entity.position.x + (Math.random() * 20 - 10)
        const y = bot.entity.position.y
        const z = bot.entity.position.z + (Math.random() * 20 - 10)
        bot.pathfinder.setGoal(new GoalBlock(Math.floor(x), Math.floor(y), Math.floor(z)))
      }, 20000)

      // ===== Random chat
      talkTimer = setInterval(() => {
        if (!canChat()) return
        const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)]
        bot.chat(msg)
        lastChat = Date.now()
      }, 30000)

      // ===== Utility: find player entity
      function getPlayerEntity(name) {
        const data = bot.players[name]
        return data?.entity || null
      }

      // ===== Utility: go near entity
      async function gotoEntity(ent, range = 1) {
        if (!ent) return false
        const goal = new GoalNear(ent.position.x, ent.position.y, ent.position.z, range)
        try { await bot.pathfinder.goto(goal); return true } catch { return false }
      }

      // ===== Utility: toss all items
      async function tossAll() {
        for (const it of bot.inventory.items()) {
          try { await bot.tossStack(it) } catch {}
        }
      }

      // ===== Utility: collect item types using mineflayer-collectblock
      async function collectByName(names = [], maxCount = 16, searchRadius = 64) {
        // Find blocks matching
        const mcDataItems = mcData.blocks
        const targets = []
        const origin = bot.entity.position.floored()
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          for (let dy = -8; dy <= 8; dy++) {
            for (let dz = -searchRadius; dz <= searchRadius; dz++) {
              const pos = origin.offset(dx, dy, dz)
              const b = bot.blockAt(pos)
              if (!b) continue
              const n = b.name || ""
              if (names.some(s => n.includes(s))) {
                targets.push(b)
                if (targets.length >= maxCount) break
              }
            }
            if (targets.length >= maxCount) break
          }
          if (targets.length >= maxCount) break
        }
        if (targets.length === 0) return 0

        try {
          await bot.collectBlock.collect(targets, { count: maxCount })
          return targets.length
        } catch {
          return 0
        }
      }

      // ===== Flatten area (WxH)
      async function flattenArea(width, height) {
        cancelBuildOrTask = false
        const base = bot.entity.position.floored()
        const startX = base.x - Math.floor(width/2)
        const startZ = base.z - Math.floor(height/2)
        const y = base.y

        bot.safeChat(`🧹 بسطّح منطقة ${width}x${height} على الارتفاع Y=${y}...`)

        for (let x = 0; x < width; x++) {
          for (let z = 0; z < height; z++) {
            if (cancelBuildOrTask) { bot.safeChat("⛔ وقفت التسطيح"); return }
            const targetPos = { x: startX + x, y, z: startZ + z }
            // 1) اكسر اي بلوك فوق مستوى y (نظف السطح)
            for (let yy = y + 4; yy >= y; yy--) {
              const pos = bot.blockAt({ x: targetPos.x, y: yy, z: targetPos.z })
              if (!pos) continue
              if (pos.boundingBox === 'block' && pos.position.y >= y) {
                await gotoBlock(targetPos.x, yy, targetPos.z)
                await breakBlockAt(pos.position)
                await delay(50)
              }
            }
            // 2) لو في حُفر تحت السطح، املها بديرت لو معاك
            for (let yy = y - 1; yy >= y - 3; yy--) {
              const b = bot.blockAt({ x: targetPos.x, y: yy, z: targetPos.z })
              if (!b || b.name === 'air') {
                // حاول تحط ديرت من الانفنتوري
                const dirt = bot.inventory.items().find(i => /dirt/.test(i.name))
                if (dirt) {
                  try {
                    await bot.equip(dirt, 'hand')
                    const under = bot.blockAt({ x: targetPos.x, y: yy - 1, z: targetPos.z })
                    if (under) {
                      await gotoBlock(under.position.x, under.position.y, under.position.z)
                      await bot.placeBlock(under, { x: 0, y: 1, z: 0 })
                    }
                  } catch {}
                }
              }
            }
          }
        }
        bot.safeChat("✅ خلصت تسطيح المنطقة!")
      }

      async function gotoBlock(x, y, z, range = 1) {
        const goal = new GoalNear(x, y, z, range)
        try { await bot.pathfinder.goto(goal); return true } catch { return false }
      }

      // ===== Commands
      bot.on('chat', async (player, message) => {
        if (player === bot.username) return
        const lower = message.toLowerCase()

        // Smart small talk
        const s = smartReply(lower)
        if (s) bot.safeChat(s)

        // --- Helpers for passworded commands
        const startsWithSelf = (cmd) => lower.startsWith(bot.username.toLowerCase() + " " + cmd)
        const lastToken = () => lower.trim().split(/\s+/).pop()
        const checkPass = () => lastToken() === BOT_PASSWORD

        // ===== give me
        if (startsWithSelf("give me")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          const ent = getPlayerEntity(player)
          if (!ent) return bot.safeChat(`❌ مش لاقيك يا ${player}`)
          bot.safeChat(`تمام يا ${player} 😃 جاي`)
          await gotoEntity(ent, 1)
          await tossAll()
          return
        }

        // ===== follow me
        if (startsWithSelf("follow me")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          const ent = getPlayerEntity(player)
          if (!ent) return bot.safeChat(`❌ مش لاقيك يا ${player}`)
          bot.safeChat(`👣 حاضر يا ${player}, جاي وراك!`)
          bot.pathfinder.setGoal(new GoalFollow(ent, 1), true)
          return
        }

        // ===== stop follow
        if (startsWithSelf("stop follow")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          bot.pathfinder.setGoal(null)
          bot.safeChat(`🛑 وقفت المتابعة!`)
          return
        }

        // ===== build tower
        if (startsWithSelf("build tower")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          cancelBuildOrTask = false
          const blockItem = bot.inventory.items().find(i => i.name.includes("block"))
          if (!blockItem) return bot.safeChat("❌ ماعنديش بلوكات للبناء")
          bot.safeChat("🧱 ببني برج!")
          ;(async () => {
            try {
              await bot.equip(blockItem, 'hand')
              for (let i = 0; i < 10; i++) {
                if (cancelBuildOrTask) break
                const pos = bot.entity.position.floored()
                const blockBelow = bot.blockAt(pos.offset(0, -1, 0))
                if (!blockBelow) break
                await bot.placeBlock(blockBelow, { x: 0, y: 1, z: 0 })
                await delay(450)
              }
              bot.safeChat("✅ خلصت البرج!")
            } catch (e) { bot.safeChat("❌ مش قادر ابني البرج") }
          })()
          return
        }

        // ===== build house
        if (startsWithSelf("build house")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          cancelBuildOrTask = false
          const blockItem = bot.inventory.items().find(i => i.name.includes("block"))
          if (!blockItem) return bot.safeChat("❌ ماعنديش بلوكات للبناء")
          bot.safeChat("🏠 ببني بيت!")
          ;(async () => {
            try {
              await bot.equip(blockItem, 'hand')
              const pos = bot.entity.position.floored()
              for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 5; x++) {
                  for (let z = 0; z < 5; z++) {
                    if (cancelBuildOrTask) return
                    if (x === 0 || x === 4 || z === 0 || z === 4) {
                      if (z === 0 && (x === 2 || x === 3) && y < 2) continue // باب
                      const target = bot.blockAt(pos.offset(x, y, z))
                      if (!target) continue
                      const under = bot.blockAt(pos.offset(x, y-1, z))
                      const placeOn = under || target
                      await gotoBlock(placeOn.position.x, placeOn.position.y, placeOn.position.z)
                      await bot.placeBlock(placeOn, { x: 0, y: 1, z: 0 })
                      await delay(250)
                    }
                  }
                }
              }
              // السقف
              for (let x = 0; x < 5; x++) {
                for (let z = 0; z < 5; z++) {
                  if (cancelBuildOrTask) return
                  const t = bot.blockAt(pos.offset(x, 4, z))
                  const on = bot.blockAt(pos.offset(x, 3, z))
                  if (!on) continue
                  await gotoBlock(on.position.x, on.position.y, on.position.z)
                  await bot.placeBlock(on, { x: 0, y: 1, z: 0 })
                  await delay(250)
                }
              }
              bot.safeChat("✅ خلصت البيت!")
            } catch { bot.safeChat("❌ حصل خطأ في بناء البيت") }
          })()
          return
        }

        // ===== stop build / stop task
        if (startsWithSelf("stop build") || startsWithSelf("stop task")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          cancelBuildOrTask = true
          bot.pathfinder.setGoal(null)
          bot.safeChat(`🛑 وقفت المهمة!`)
          return
        }

        // ===== guard (orbit small circle around current point)
        if (startsWithSelf("guard")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          safeClear(guardTimer)
          const pos = bot.entity.position.floored()
          bot.safeChat("🛡️ بحرس المنطقة!")
          let step = 0
          guardTimer = setInterval(() => {
            const dx = Math.cos(step) * 5
            const dz = Math.sin(step) * 5
            bot.pathfinder.setGoal(new GoalBlock(Math.floor(pos.x + dx), pos.y, Math.floor(pos.z + dz)))
            step += Math.PI / 2
          }, 6000)
          return
        }

        // ===== patrol (square path)
        if (startsWithSelf("patrol")) {
          if (!checkPass()) return bot.safeChat("❌ باسورد غلط")
          safeClear(patrolTimer)
          bot.safeChat("🚶‍♂️ بعمل دورية حوالين المكان!")
          const base = bot.entity.position.floored()
          const points = [
            base.offset(5, 0, 5),
            base.offset(-5, 0, 5),
            base.offset(-5, 0, -5),
            base.offset(5, 0, -5)
          ]
          let i = 0
          patrolTimer = setInterval(() => {
            const p = points[i]
            bot.pathfinder.setGoal(new GoalBlock(p.x, p.y, p.z))
            i = (i + 1) % points.length
          }, 10000)
          return
        }

        // ===== flatten W H
        if (startsWithSelf("flatten")) {
          // e.g. "BOTNAME flatten 80 80 7717"
          const parts = lower.split(/\s+/)
          if (parts.length < 5) return bot.safeChat("❌ استخدم: <BOT> flatten <width> <height> <password>")
          const w = parseInt(parts[2], 10)
          const h = parseInt(parts[3], 10)
          const pass = parts[4]
          if (pass !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")
          if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return bot.safeChat("❌ قيم غير صالحة")
          cancelBuildOrTask = false
          flattenArea(w, h).catch(()=> bot.safeChat("⚠️ فشل في التسطيح"))
          return
        }

        // ===== gather <wood|diamond|dirt|stone> <qty> <password>
        if (startsWithSelf("gather")) {
          const parts = lower.split(/\s+/)
          // BOT gather type qty pass
          if (parts.length < 5) {
            return bot.safeChat("❌ استخدم: <BOT> gather <wood|diamond|dirt|stone> <qty> <password>")
          }
          const type = parts[2]
          const qty = Math.max(1, parseInt(parts[3],10)||1)
          const pass = parts[4]
          if (pass !== BOT_PASSWORD) return bot.safeChat("❌ باسورد غلط")

          // Map resource types to block name filters
          let filters = []
          if (type === 'wood') filters = ['log','stem']         // overworld + nether variants
          else if (type === 'dirt') filters = ['dirt']
          else if (type === 'stone') filters = ['stone','andesite','diorite','granite','deepslate']
          else if (type === 'diamond') filters = ['diamond_ore','deepslate_diamond_ore']
          else return bot.safeChat("❌ نوع غير مدعوم")

          bot.safeChat(`⛏️ بجمع ${type} (${qty}) ...`)
          cancelBuildOrTask = false
          ;(async () => {
            const got = await collectByName(filters, qty, 64)
            bot.safeChat(`✅ جمعت تقريبًا ${got} بلوك/قطعة من ${type}. جاي أديهملك.`)
            const ent = getPlayerEntity(player)
            if (ent) {
              await gotoEntity(ent, 1)
              await tossAll()
            } else {
              bot.safeChat(`⚠️ مش لاقيك دلوقتي يا ${player}، قول follow me + الباسورد وهاجي`)
            }
          })()
          return
        }
      })

    }) // end spawn

    // ====== Errors + reconnect
    bot.on('kicked', (reason) => {
      console.log(`⚠️ ${username} kicked:`, reason)
    })
    bot.on('error', err => console.log(`❌ Error ${username}:`, err))
    bot.on('end', () => {
      console.log(`⚠️ ${username} خرج، هيعيد الدخول بعد 30 ثانية...`)
      setTimeout(startBot, 30000)
    })
  }

  startBot()
}

// ===== Start all bots
botNames.forEach(name => createBot(name))

// ===== Tiny web server (Render/Railway keepalive)
const app = express()
app.get('/', (req, res) => res.send('✅ Smart Minecraft Bots are running!'))
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Web server running")
})

// ===== Anti-Crash
process.on('uncaughtException', err => console.error('💥 Uncaught Exception:', err))
process.on('unhandledRejection', (reason) => console.error('💥 Unhandled Rejection:', reason))
// ======================= END =======================
// ==========================
// 🤖 جزء 7 من 8 - الأوامر الذكية
// ==========================

// 🧠 ردود ذكية حسب الرسائل
bot.on('chat', (username, message) => {
  if (username === bot.username) return

  const lowerMsg = message.toLowerCase()

  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    bot.chat(`Hello ${username}! 👋 How are you?`)
  }

  if (lowerMsg.includes('thanks') || lowerMsg.includes('thx')) {
    bot.chat(`You're welcome ${username}! 🙏`)
  }

  if (lowerMsg.includes('bye')) {
    bot.chat(`Goodbye ${username}, see you soon! 👋`)
  }

  if (lowerMsg.includes('joke')) {
    const jokes = [
      "Why don't skeletons fight each other? They don't have the guts. 💀",
      "What do you call fake spaghetti? An impasta! 🍝",
      "Why did the computer go to the doctor? Because it caught a virus. 🦠"
    ]
    const joke = jokes[Math.floor(Math.random() * jokes.length)]
    bot.chat(joke)
  }
})

// 🛡️ حماية إضافية للمنطقة
let patrolInterval = null
function startPatrolArea(center, radius = 20) {
  if (patrolInterval) clearInterval(patrolInterval)
  bot.chat("🚶 Starting patrol around the base...")

  patrolInterval = setInterval(() => {
    const angle = Math.random() * 2 * Math.PI
    const x = center.x + Math.cos(angle) * radius
    const z = center.z + Math.sin(angle) * radius
    const y = bot.entity.position.y
    bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z))
  }, 30000) // يتحرك كل 30 ثانية
}

// 🪓 كسر البلوكات بالأداة المناسبة
function breakBlockSmart(block) {
  if (!block) return
  const name = block.name

  let tool = null
  if (name.includes('stone') || name.includes('ore')) {
    tool = bot.inventory.items().find(i => i.name.includes('pickaxe'))
  } else if (name.includes('wood') || name.includes('log')) {
    tool = bot.inventory.items().find(i => i.name.includes('axe'))
  } else if (name.includes('dirt') || name.includes('grass')) {
    tool = bot.inventory.items().find(i => i.name.includes('shovel'))
  }

  if (tool) bot.equip(tool, 'hand').then(() => bot.dig(block))
  else bot.dig(block)
}

// 🐄 تجميع الأكل لو البوت جعان
function autoEatFood() {
  if (bot.food < 10) {
    const food = bot.inventory.items().find(i =>
      i.name.includes('beef') || i.name.includes('pork') || i.name.includes('chicken') || i.name.includes('bread')
    )
    if (food) {
      bot.equip(food, 'hand').then(() => bot.consume())
      bot.chat("🍖 Eating to heal...")
    }
  }
}
setInterval(autoEatFood, 5000)

// 🛠️ أوامر من الشات
bot.on('chat', (username, message) => {
  if (username === bot.username) return

  if (message === 'guard') {
    const pos = bot.entity.position.clone()
    startPatrolArea(pos, 25)
    bot.chat("🛡️ Guard mode ON")
  }

  if (message === 'stop guard') {
    if (patrolInterval) {
      clearInterval(patrolInterval)
      bot.chat("🛡️ Guard mode OFF")
    }
  }

  if (message.startsWith('give me')) {
    const parts = message.split(' ')
    const itemName = parts.slice(2).join(' ')
    const item = bot.inventory.items().find(i => i.name.includes(itemName))
    if (item) {
      bot.tossStack(item)
      bot.chat(`🎁 Gave ${username} some ${itemName}`)
    } else {
      bot.chat(`❌ I don't have ${itemName}, ${username}`)
    }
  }
})
// ==========================
// 🤖 جزء 8 من 8 - النسخة النهائية العملاقة
// ==========================

// 🏗️ Flatten area (80x80)
async function flattenArea(center, size = 80) {
  bot.chat("🚜 Flattening area...")

  for (let x = center.x - size / 2; x < center.x + size / 2; x++) {
    for (let z = center.z - size / 2; z < center.z + size / 2; z++) {
      const pos = bot.blockAt(new Vec3(x, center.y, z))
      if (pos && pos.name !== 'air') {
        try {
          await breakBlockSmart(pos)
        } catch (err) {
          bot.chat(`⚠️ Can't break block at ${x}, ${z}`)
        }
      }
    }
  }
  bot.chat("✅ Flatten done!")
}

// 🌲 زراعة شجر تلقائية
async function autoPlantTrees(center, radius = 20) {
  bot.chat("🌱 Planting trees in area...")
  const sapling = bot.inventory.items().find(i => i.name.includes('sapling'))
  if (!sapling) {
    bot.chat("❌ No saplings to plant")
    return
  }

  for (let i = 0; i < 10; i++) {
    const x = center.x + Math.floor(Math.random() * radius - radius / 2)
    const z = center.z + Math.floor(Math.random() * radius - radius / 2)
    const y = center.y
    const pos = new Vec3(x, y, z)
    try {
      await bot.equip(sapling, 'hand')
      await bot.placeBlock(bot.blockAt(pos), new Vec3(0, 1, 0))
      bot.chat(`🌲 Planted a tree at ${x}, ${z}`)
    } catch (err) {
      // ignore
    }
  }
}

// ⚔️ قتل الوحوش في المنطقة
function autoAttackMobs() {
  const mobs = Object.values(bot.entities).filter(e => e.type === 'mob' && e.mobType !== 'Armor Stand')
  if (mobs.length > 0) {
    const target = mobs[0]
    bot.chat(`⚔️ Attacking ${target.mobType}!`)
    bot.lookAt(target.position)
    bot.attack(target)
  }
}
setInterval(autoAttackMobs, 6000)

// 🏗️ تحميل schematics (بنايات)
const { Schematic } = require('prismarine-schematic')
const fs = require('fs')

async function loadSchematic(filePath, pos) {
  bot.chat(`📂 Loading schematic ${filePath}...`)
  const buffer = fs.readFileSync(filePath)
  const schematic = await Schematic.read(buffer)
  bot.chat(`✅ Schematic loaded, starting build...`)

  for (let y = 0; y < schematic.height; y++) {
    for (let x = 0; x < schematic.width; x++) {
      for (let z = 0; z < schematic.length; z++) {
        const block = schematic.getBlock(new Vec3(x, y, z))
        if (block && block.name !== 'air') {
          const worldPos = pos.offset(x, y, z)
          try {
            await bot.placeBlock(bot.blockAt(worldPos), new Vec3(0, 1, 0))
          } catch (err) {
            // skip
          }
        }
      }
    }
  }

  bot.chat("🏗️ Finished building schematic!")
}

// 🧾 أوامر عامة من الشات
bot.on('chat', async (username, message) => {
  if (username === bot.username) return

  if (message === 'flatten') {
    const center = bot.entity.position.floored()
    await flattenArea(center, 80)
  }

  if (message === 'plant trees') {
    const center = bot.entity.position.floored()
    await autoPlantTrees(center, 30)
  }

  if (message.startsWith('build')) {
    const parts = message.split(' ')
    const file = parts[1]
    if (!file) {
      bot.chat("❌ Please provide schematic file name")
      return
    }
    const pos = bot.entity.position.floored()
    await loadSchematic(`./schematics/${file}`, pos)
  }
})

// 🚀 Auto start message
bot.once('spawn', () => {
  bot.chat("🤖 Bot fully loaded with ALL features ✅")
  bot.chat("💡 Available commands: guard, stop guard, give me <item>, flatten, plant trees, build <file>")
})
