const mineflayer = require('mineflayer')

// إعدادات السيرفر بتاعك
const CONFIG = {
  host: 'duckRsco.aternos.me',
  port: 23571,
  version: false // false = يخلي البوت يتعرف أوتوماتيك على الإصدار
}

// أسماء البوتات
const BOT_NAMES = ['duck1', 'duck2']

// وظيفة تشغيل بوت واحد
function createBot(username) {
  const bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: username,
    version: CONFIG.version
  })

  bot.on('login', () => {
    console.log(`${username} دخل السيرفر.`)
    wander()
  })

  bot.on('spawn', () => {
    console.log(`${username} ظهر في العالم.`)
  })

  bot.on('error', (err) => {
    console.log(`خطأ مع ${username}:`, err)
  })

  bot.on('end', () => {
    console.log(`${username} خرج من السيرفر.`)
    // إعادة تشغيل تلقائي بعد 5 ثواني
    setTimeout(() => createBot(username), 5000)
  })

  // وظيفة الحركة العشوائية
  function wander() {
    const actions = ['forward', 'back', 'left', 'right', 'jump']
    const action = actions[Math.floor(Math.random() * actions.length)]
    const duration = 1000 + Math.random() * 2000 // من ثانية لـ 3 ثواني

    if (action === 'jump') {
      bot.setControlState('jump', true)
      setTimeout(() => {
        bot.setControlState('jump', false)
        setTimeout(wander, 1000)
      }, 400)
    } else {
      bot.setControlState(action, true)
      setTimeout(() => {
        bot.setControlState(action, false)
        setTimeout(wander, 1000 + Math.random() * 2000)
      }, duration)
    }
  }
}

// تشغيل البوتين
BOT_NAMES.forEach(name => createBot(name))
