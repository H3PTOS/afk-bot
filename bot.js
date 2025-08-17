import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const PREFIX = '!';
const afkMap = new Map(); // userId -> { reason, since }

// Ready
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Message handler
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  // If AFK user talks -> remove AFK
  if (afkMap.has(msg.author.id)) {
    afkMap.delete(msg.author.id);
    try {
      await msg.reply(`مرحبًا رجعت! شلت عنك حالة AFK ✅`);
    } catch (_) {}
  }

  // Notify when mentioning AFK users
  if (msg.mentions.users.size > 0) {
    for (const [, user] of msg.mentions.users) {
      if (afkMap.has(user.id)) {
        const { reason, since } = afkMap.get(user.id);
        const minutes = Math.floor((Date.now() - since) / 60000);
        await msg.reply(
          `${user.tag} حاليًا AFK منذ ${minutes} دقيقة${minutes !== 1 ? '' : ''}.\nالسبب: ${reason || 'بدون سبب'}`
        );
      }
    }
  }

  // Commands
  if (!msg.content.startsWith(PREFIX)) return;
  const [cmd, ...args] = msg.content.slice(PREFIX.length).trim().split(/\s+/);

  if (cmd.toLowerCase() === 'afk') {
    const reason = args.join(' ').trim();
    afkMap.set(msg.author.id, { reason, since: Date.now() });
    return void msg.reply(`تمام! فعلت لك AFK${reason ? ` — السبب: ${reason}` : ''} 💤`);
  }

  if (cmd.toLowerCase() === 'back' || cmd.toLowerCase() === 'unafk') {
    if (afkMap.has(msg.author.id)) {
      afkMap.delete(msg.author.id);
      return void msg.reply(`شلت عنك AFK ✅`);
    } else {
      return void msg.reply(`انت مش على AFK حاليا.`);
    }
  }

  if (cmd.toLowerCase() === 'ping') {
    return void msg.reply(`Pong! 🏓`);
  }
});

client.login(process.env.BOT_TOKEN);
