'use strict'
const { Devices, ResponseApdu, CommandApdu } = require('smartcard')
const { StringDecoder } = require('string_decoder')
const { EventEmitter } = require('events')
const utf8 = require('utf8')
const COMMAND = require('./APDUCommand')
const Person = require('./Person')

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
        // Wait for device ready !
        await new Promise((resolve, reject) => {
          setTimeout(() => { resolve() }, 100)
        })

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
          let cid = (await this.runAndReadAllByteToString(this.card, COMMAND.GET.CID)).substring(0, 13)
          let enFullName = await this.runAndReadAllByteToString(this.card, COMMAND.GET.EN_FULLNAME)
          let thFullName = await this.runAndReadAllByteToString(this.card, COMMAND.GET.TH_FULLNAME, isThai)
          let dob = await this.runAndReadAllByteToString(this.card, COMMAND.GET.DOB)
          let gender = await this.runAndReadAllByteToString(this.card, COMMAND.GET.GENDER)
          let expireDate = await this.runAndReadAllByteToString(this.card, COMMAND.GET.EXPIRE_DATE)
          let issueDate = await this.runAndReadAllByteToString(this.card, COMMAND.GET.ISSUE_DATE)
          let issuer = await this.runAndReadAllByteToString(this.card, COMMAND.GET.ISSUER, isThai)
          let address = await this.runAndReadAllByteToString(this.card, COMMAND.GET.ADDRESS, isThai)
          let photoArray = await this.readPhoto(this.card)

          enFullName = this.sharpToSpace(enFullName).trim()
          thFullName = this.sharpToSpace(thFullName).trim()
          address = this.sharpToSpace(address).trim()
          issuer = this.sharpToSpace(issuer).trim()

          // Return Person Object
          let person = new Person()
          person.setCID(cid)
          person.setNameEN(enFullName)
          person.setNameTH(thFullName)
          person.setDoB(dob)
          person.setGender(gender)
          person.setAddress(address)
          person.setExpireDate(expireDate)
          person.setIssueDate(issueDate)
          person.setIssuer(issuer)
          person.setPhoto(photoArray)
          this.emit('card-readed', person)

        } catch (err) {
          console.log(err)
        }
      })
    })
  }

  runAndReadAllByteToString(card, apduCommand, isThai = false) {
    return new Promise(async (resolve, reject) => {
      let apduResponse = await this.runCommand(card, apduCommand)
      if (apduResponse.hasMoreBytesAvailable()) {
        let data = await this.getMoreByte(card, apduResponse)
        if (isThai) {
          data = this.tis620ToUTF8(data)
        }
        let stringData = this.stringFromUTF8Array(data)
        resolve(stringData)
      } else {
        if (apduResponse.isOk()) {
          resolve(apduResponse)
        } else {
          reject(apduResponse)
        }
      }
    })
  }

  runAndReadAllByte(card, apduCommand) {
    return new Promise(async (resolve, reject) => {
      let apduResponse = await this.runCommand(card, apduCommand)
      if (apduResponse.hasMoreBytesAvailable()) {
        let data = await this.getMoreByte(card, apduResponse)
        resolve(data)
      } else {
        if (apduResponse.isOk()) {
          resolve(apduResponse)
        } else {
          reject(apduResponse)
        }
      }
    })
  }

  runCommand(card, apduCommand) {
    return new Promise(async (resolve, reject) => {
      let rawResponse
      try {
        rawResponse = await card.issueCommand(new CommandApdu({
          bytes: apduCommand
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

  getMoreByte(card, apduResponse, inheritMoreByte = []) {
    let moreByte = inheritMoreByte
    return new Promise(async (resolve, reject) => {
      let numOfAvaiableData = apduResponse.numberOfBytesAvailable()
      try {
        let moreByteResponse = await this.runCommand(card, [...COMMAND.GET.RESPONSE, numOfAvaiableData])
        moreByte.push(...moreByteResponse.buffer)
        if (moreByteResponse.hasMoreBytesAvailable()) {
          await this.getMoreByte(card, moreByteResponse, moreByte)
        }
        resolve(moreByte.splice(0, moreByte.length - 2))
      } catch (err) {
        reject(err)
      }
    })
  }

  stringFromUTF8Array(data = []) {
    const stringArray = data.map(item => String.fromCharCode(item))
    return stringArray.join('')
  }

  sharpToSpace(data = "") {
    return data.replace(/#/g, ' ')
  }

  tis620ToUTF8 (data = []) {
    let returnData = data.map(item => {
      if(item > 0 && item < 65) {
        return item
      }
      else {
        return item - 161 + 3585
      }
    })
    return returnData
  }

  readPhoto(card) {
    return new Promise(async (resolve, reject) => {
      let collectArray = []
      for(let i = 0; i < 20; i++) {
        let part = await this.runAndReadAllByte(card, COMMAND.GET.PHOTO[i])
        collectArray.push(...part)
      }
      resolve(collectArray)
    })
  }
}

module.exports = Reader