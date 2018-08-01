'use strict'
const Person = require('./Person')
const { Devices } = require('smartcard')
const { EventEmitter } = require('events')
const utf8 = require('utf8')
const ReaderUtils = require('./ReaderUtils')

class Reader extends EventEmitter {
  constructor(option) {
    super()
    if(option == null) {
      option = {
        autoRead: true
      }
    } else {
      if(option.autoRead == null) {
        option.autoRead = true
      }
    }
    console.log(option)
    this.devices = new Devices()
    this.device = null
    this.card = null
    this.devices.on('error', err => this.emit('error', err))
    this.devices.on('device-deactivated', event => this.emit('device-deactivated', event))    
    this.devices.on('device-activated', event => {
      this.device = event.device;
      this.device.on('error', err => { this.emit('error', err) })
      this.emit('device-activated', {
        name: this.device.name
      })
      this.device.on('card-inserted', async event => {
        // Wait for device ready !
        await new Promise((resolve, reject) => {
          setTimeout(() => { resolve() }, 100)
        })
        this.card = event.card
        this.card.on('error', (err) => { this.emit(err) })
        // Enter MOI_ID
        try {
          await ReaderUtils.initCard(this.card)
          this.emit('card-inserted', new Person(this.card, this))
        } catch (err) { this.emit('error', err) }
      })
      this.device.on('card-removed', event => this.emit('card-removed', event))
    })
  }
}

module.exports = Reader
