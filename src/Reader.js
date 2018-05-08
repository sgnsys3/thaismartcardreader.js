'use strict'
const { EventEmitter } = require('events')
const { Devices, ResponseApdu, CommandApdu } = require('smartcard')
const COMMAND = require('./APBUCommand')
const Person = require('./Person')
const utf8 = require('utf8')
const { StringDecoder } = require('string_decoder')

class Reader extends EventEmitter {
  constructor() {
    super()
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
        this.emit('card-inserted', event)
        this.card = event.card
        // Enter MOI_ID
        try {
          this.runCommand(this.card, COMMAND.MOI).catch(err => {
            if (err.hasMoreBytesAvailable() == false) {
              this.emit('error', err)
              new Error(err.meaning())
            }
          })
          // READ Card
          const isThai = true
          let cid = (await this.runAndReadAllByte(this.card, COMMAND.GET.CID)).substring(0, 13)
          let enFullName = await this.runAndReadAllByte(this.card, COMMAND.GET.EN_FULLNAME)
          let thFullName = await this.runAndReadAllByte(this.card, COMMAND.GET.TH_FULLNAME, isThai)

          // Return Person Object
          let person = new Person()
          person.setCID(cid)
          person.setNameEN(enFullName)
          person.setNameTH(thFullName)
          this.emit('card-readed', person)

        } catch (err) {
          if(err.hasMoreBytesAvailable() == false) {
            this.emit('error', err)
          }
        }
      })
    })
  }

  runAndReadAllByte(card, apbuCommand, isThai = false) {
    return new Promise(async (resolve, reject) => {
      let apbuResponse = await this.runCommand(card, apbuCommand)
      if (apbuResponse.hasMoreBytesAvailable()) {
        let data = await this.getMoreByte(card, apbuResponse)
        if (isThai) {
          data = this.tis620ToUTF8(data)
        }
        let stringData = this.stringFromUTF8Array(data)
        resolve(stringData)
      } else {
        if (apbuResponse.isOk()) {
          resolve(apbuResponse)
        } else {
          reject(apbuResponse)
        }
      }
    })
  }

  runCommand(card, apbuCommand) {
    return new Promise(async (resolve, reject) => {
      let rawResponse
      try {
        rawResponse = await card.issueCommand(new CommandApdu({
          bytes: apbuCommand
        }))
      } catch (err) {
        rawResponse = err
      }
      let response = new ResponseApdu(rawResponse)
      if (response.isOk() || response.hasMoreBytesAvailable()) {
        resolve(response)
      } else {
        reject(response)
      }
    }) 
  }

  getMoreByte(card, apbuResponse, inheritMoreByte = []) {
    let moreByte = inheritMoreByte
    return new Promise(async (resolve, reject) => {
      let numOfAvaiableData = apbuResponse.numberOfBytesAvailable()
      try {
        let moreByteResponse = await this.runCommand(card, [...COMMAND.GET.RESPONSE, numOfAvaiableData])
        moreByte.push(...moreByteResponse.buffer)
        if (moreByteResponse.hasMoreBytesAvailable()) {
          await this.getMoreByte(card, moreByteResponse, moreByte)
        }
        resolve(moreByte)
      } catch (err) {
        reject(err)
      }
    })
  }

  stringFromUTF8Array(data = []) {
    const stringArray = data.map(item => String.fromCharCode(item))
    return stringArray.join('')
  }

  tis620ToUTF8 (data = []) {
    let returnData = data.map(item => item - 161 + 3585)
    return returnData
  }
}

module.exports = Reader