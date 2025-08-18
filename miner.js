const mineflayer = require('mineflayer')
const { setupBot } = require('./shared')

function createMiner(options) {
  const bot = mineflayer.createBot(options)
  setupBot(bot)

  bot.once('spawn', async () => {
    console.log(`[Miner] ${bot.username} spawned.`)
    await bot.equipBestArmor()
    await bot.equipWeapon()
    startMining()
  })

  function startMining() {
    setInterval(() => {
      const target = bot.findBlock({
        matching: block => ['stone', 'coal_ore', 'iron_ore'].includes(block.name),
        maxDistance: 32
      })
      if (target) bot.dig(target).catch(() => {})
    }, 5000)
  }

  return bot
}

module.exports = { createMiner }
