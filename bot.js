const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals
const Vec3 = require('vec3')

// بيانات السيرفر
const server = {
  host: 'GOLDEN-u8nn.aternos.me',
  port: 23761,
  version: false
}

// أسماء البوتات
const botNames = ['GOOLDENBOT-1', 'GOOLDENBOT-2', 'GOOLDENBOT-3']

function createBot(username) {
  const bot = mineflayer.createBot({
    host: server.host,
    port: server.port,
    username: username,
    version: server.version
  })

  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    const defaultMove = new Movements(bot)
    bot.pathfinder.setMovements(defaultMove)

    // تحريك البوت بشكل عشوائي كل فترة لتجنب الطرد كـ AFK
    function wander() {
      const x = bot.entity.position.x + (Math.random() * 10 - 5)
      const y = bot.entity.position.y
      const z = bot.entity.position.z + (Math.random() * 10 - 5)
      bot.pathfinder.setGoal(new GoalNear(x, y, z, 1))
      setTimeout(wander, 5000)
    }
    wander()
  })

  bot.on('error', err => console.log(username + ' error:', err))
  bot.on('end', () => {
    console.log(username + ' disconnected. Reconnecting...')
    setTimeout(() => createBot(username), 5000)
  })
}

// تشغيل جميع البوتات
botNames.forEach(name => createBot(name))
