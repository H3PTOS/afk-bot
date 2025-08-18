const mineflayer = require('mineflayer')
const { setupBot } = require('./shared')

function createFarmer(options) {
  const bot = mineflayer.createBot(options)
  setupBot(bot)

  bot.once('spawn', async () => {
    console.log(`[Farmer] ${bot.username} spawned.`)
    await bot.equipBestArmor()
    await bot.equipWeapon()
    farmLoop()
  })

  function farmLoop() {
    setInterval(() => {
      const crops = bot.findBlock({
        matching: block => ['wheat', 'carrots', 'potatoes'].includes(block.name),
        maxDistance: 32
      })
      if (crops) bot.dig(crops).catch(() => {})
    }, 8000)
  }

  return bot
}

module.exports = { createFarmer }
