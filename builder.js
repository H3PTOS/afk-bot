const mineflayer = require('mineflayer')
const { setupBot } = require('./shared')

function createBuilder(options) {
  const bot = mineflayer.createBot(options)
  setupBot(bot)

  bot.once('spawn', async () => {
    console.log(`[Builder] ${bot.username} spawned.`)
    await bot.equipBestArmor()
    await bot.equipWeapon()
    buildHouse()
  })

  async function buildHouse() {
    // يبني مربع 10x10 من خشب
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        const ref = bot.blockAt(bot.entity.position.offset(x, 0, z))
        if (ref && bot.canSeeBlock(ref)) {
          const wood = bot.inventory.items().find(i => i.name.includes('planks'))
          if (wood) {
            try {
              await bot.placeBlock(ref, { x: 0, y: 1, z: 0 })
            } catch (err) {}
          }
        }
      }
    }
  }

  return bot
}

module.exports = { createBuilder }
