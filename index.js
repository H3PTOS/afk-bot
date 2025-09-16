const mineflayer = require('mineflayer')

function createBot(name) {
  const bot = mineflayer.createBot({
    host: "xebexxx.aternos.me", // IP السيرفر
    port: 40724,                // البورت
    username: name,             // اسم البوت
    version: false              // يختار الإصدار تلقائي
  })

  bot.on('spawn', () => {
    console.log(`✅ ${name} دخل السيرفر`)

    // حركة عشوائية
    setInterval(() => {
      const directions = ['forward', 'back', 'left', 'right']
      const dir = directions[Math.floor(Math.random() * directions.length)]

      bot.setControlState(dir, true)
      setTimeout(() => bot.setControlState(dir, false), 2000)
    }, 5000)

    // نطة كل دقيقة
    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
    }, 60000)
  })

  bot.on('end', () => {
    console.log(`❌ ${name} خرج - بيحاول يدخل تاني...`)
    setTimeout(() => createBot(name), 5000)
  })
}

createBot("AFKBOT1")
createBot("AFKBOT2")
