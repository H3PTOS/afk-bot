const mineflayer = require('mineflayer')

// دالة تعمل بوت
function createBot(name) {
  const bot = mineflayer.createBot({
    host: "ojovals.aternos.me", // IP السيرفر بتاعك
    username: name,             // اسم البوت
    version: false              // يخلي البوت يكتشف الإصدار تلقائي
  })

  bot.on('spawn', () => {
    console.log(`✅ ${name} دخل السيرفر`)

    // يمشي عشوائي علشان يلفلف في العالم
    setInterval(() => {
      const directions = ['forward', 'back', 'left', 'right']
      const dir = directions[Math.floor(Math.random() * directions.length)]

      bot.setControlState(dir, true)
      setTimeout(() => {
        bot.setControlState(dir, false)
      }, 2000) // يمشي ثانيتين
    }, 5000) // كل 5 ثواني يغيّر اتجاه

    // يعمل نطة كل دقيقة علشان مايتطردش AFK
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

// نشغل بوتين
createBot("AFKBOT1")
createBot("AFKBOT2")
