const mineflayer = require('mineflayer')

// ====== إعدادات السيرفر ======
const bot = mineflayer.createBot({
  host: 'GOLDEN-u8nn.aternos.me', // حط هنا IP السيرفر
  port: 23761,                   // البورت بتاع السيرفر
  username: 'GOOLDENBOT1',       // اسم البوت
  version: false                 // بيكتشف نسخة السيرفر أوتوماتيك
})

bot.once('spawn', () => {
  console.log('✅ البوت دخل السيرفر!')

  // تشغيل السبرينت طول الوقت
  bot.setControlState('sprint', true)

  // يتحرك عشوائي كل 3 ثواني
  setInterval(() => {
    let directions = ['forward', 'back', 'left', 'right']
    let randomDir = directions[Math.floor(Math.random() * directions.length)]
    
    // يوقف كل الاتجاهات الأول
    directions.forEach(dir => bot.setControlState(dir, false))

    // يشغل اتجاه واحد عشوائي
    bot.setControlState(randomDir, true)
    console.log(`➡️ ماشي في اتجاه: ${randomDir}`)
  }, 3000)

  // ينط كل 5 ثواني
  setInterval(() => {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 500)
    console.log("⏫ نط!")
  }, 5000)
})

// لو حصل Error
bot.on('error', err => console.log('❌ Error: ', err))
bot.on('end', () => console.log('🚪 البوت خرج من السيرفر'))
