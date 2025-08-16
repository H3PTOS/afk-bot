const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalFollow, GoalBlock } } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const collectBlock = require('mineflayer-collectblock').plugin;
const minecraftData = require('minecraft-data');

const PASSWORD = "7717";
let lastCommandTime = 0;

const bot = mineflayer.createBot({
  host: "اسم_السيرفر", // 🟢 حط IP السيرفر
  port: 25565,
  username: "BOT_NAME" // 🟢 حط اسم البوت
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);
bot.loadPlugin(collectBlock);

bot.once('spawn', () => {
  console.log("✅ Bot spawned and ready!");
});

function checkPassword(message) {
  return message.startsWith(PASSWORD);
}

function canExecuteCommand() {
  const now = Date.now();
  if (now - lastCommandTime < 45000) return false;
  lastCommandTime = now;
  return true;
}

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  if (!checkPassword(message)) return;
  if (!canExecuteCommand()) {
    bot.chat("⏳ استنى 45 ثانية بين الأوامر.");
    return;
  }

  const args = message.slice(PASSWORD.length).trim().split(" ");
  const command = args.shift()?.toLowerCase();

  const mcData = minecraftData(bot.version);

  if (command === "follow") {
    const player = bot.players[username]?.entity;
    if (!player) return bot.chat("مش شايفك.");
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new GoalFollow(player, 2), true);
    bot.chat("🚶 همشي وراك.");
  }

  if (command === "stop") {
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
    bot.chat("✋ وقفت.");
  }

  if (command === "give" && args[0] === "me") {
    const item = bot.inventory.items()[0];
    if (!item) return bot.chat("مفيش عندي حاجة.");
    bot.tossStack(item);
    bot.chat("📦 خدت الحاجة.");
  }

  if (command === "attack") {
    const entity = bot.nearestEntity(e => e.type === 'mob');
    if (entity) {
      bot.pvp.attack(entity);
      bot.chat("⚔️ بهجم على الوحش.");
    } else {
      bot.chat("❌ مفيش وحوش قريبة.");
    }
  }

  if (command === "build") {
    const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    if (!referenceBlock) return bot.chat("❌ مش لاقي مكان أبني فيه.");
    const goal = new GoalBlock(referenceBlock.position.x + 2, referenceBlock.position.y + 1, referenceBlock.position.z);
    bot.pathfinder.setGoal(goal);
    bot.chat("🏗️ ببني قدامك.");
  }

  if (command === "stopbuild") {
    bot.pathfinder.setGoal(null);
    bot.chat("🛑 وقفت البناء.");
  }
});

// لبس الدروع أوتوماتيك
bot.on("playerCollect", (collector, item) => {
  if (collector !== bot.entity) return;
  setTimeout(() => {
    const armorTypes = ["helmet", "chestplate", "leggings", "boots"];
    for (let item of bot.inventory.items()) {
      if (armorTypes.some(type => item.name.includes(type))) {
        bot.equip(item, "torso").catch(() => {});
      }
    }
  }, 500);
});

// الأكل علشان يهيل
bot.on('health', () => {
  if (bot.food < 14) {
    const food = bot.inventory.items().find(i => i.name.includes("bread") || i.name.includes("apple"));
    if (food) bot.equip(food, 'hand').then(() => bot.consume());
  }
});
