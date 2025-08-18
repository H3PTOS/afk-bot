const { createMiner } = require('./miner')
const { createFarmer } = require('./farmer')
const { createBuilder } = require('./builder')

const server = {
  host: "YOUR_SERVER_IP",
  port: 25565,
  version: "1.20.1"
}

// أسماء عشوائية
function randomName(prefix) {
  return prefix + Math.floor(Math.random() * 10000)
}

createMiner({ username: randomName("Miner_"), ...server })
createFarmer({ username: randomName("Farmer_"), ...server })
createBuilder({ username: randomName("Builder_"), ...server })
