const { Reader } = require('../src')

const myReader = new Reader()

myReader.on('device-activated', async (event) => {
  console.log('device-activated')
  console.log(event)
})

myReader.on('error', async (err) => {
  console.log(err)
})

myReader.on('card-readed', card => {
  console.log(card)
})

myReader.on('device-deactivated', () => { console.log('device-deactivated') })