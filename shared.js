const { pathfinder, Movements } = require('mineflayer-pathfinder')
const autoeat = require('mineflayer-auto-eat')
const pvp = require('mineflayer-pvp').plugin

function setupBot(bot) {
  bot.loadPlugin(pathfinder)
  bot.loadPlugin(pvp)
  bot.loadPlugin(autoeat)

  bot.once('spawn', () => {
    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: []
    }
    console.log(`${bot.username} is ready!`)
  })

  bot.on('health', () => {
    if (bot.food < 14) bot.autoEat.enable()
    else bot.autoEat.disable()
  })

  // يلبس دروع لو موجودة
  async function equipBestArmor() {
    const armor = {
      head: ['netherite_helmet', 'diamond_helmet', 'iron_helmet'],
      chest: ['netherite_chestplate', 'diamond_chestplate', 'iron_chestplate'],
      legs: ['netherite_leggings', 'diamond_leggings', 'iron_leggings'],
      feet: ['netherite_boots', 'diamond_boots', 'iron_boots']
    }

    for (let slot in armor) {
      for (let item of armor[slot]) {
        const armorItem = bot.inventory.items().find(i => i.name.includes(item))
        if (armorItem) {
          try {
            await bot.equip(armorItem, slot)
            break
          } catch (err) {}
        }
      }
    }
  }

  // يجهز سيف للقتال
  async function equipWeapon() {
    const sword = bot.inventory.items().find(i => i.name.includes('sword'))
    if (sword) {
      try {
        await bot.equip(sword, 'hand')
      } catch (err) {}
    }
  }

  // حماية البوت
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
      const attacker = Object.values(bot.entities).find(e =>
        e.type === 'player' || e.type === 'mob'
      )
      if (attacker) {
        equipWeapon().then(() => {
          bot.pvp.attack(attacker)
          console.log(`${bot.username} is fighting ${attacker.name || attacker.mobType}`)
        })
      }
    }
  })

  bot.equipBestArmor = equipBestArmor
  bot.equipWeapon = equipWeapon
}

module.exports = { setupBot }
