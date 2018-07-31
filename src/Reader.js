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
          // READ Card
          // const isThai = true
          // let cid = (await this.runAndReadAllByteToString(this.card, COMMAND.GET.CID)).substring(0, 13)
          // let enFullName = await this.runAndReadAllByteToString(this.card, COMMAND.GET.EN_FULLNAME)
          // let thFullName = await this.runAndReadAllByteToString(this.card, COMMAND.GET.TH_FULLNAME, isThai)
          // let dob = await this.runAndReadAllByteToString(this.card, COMMAND.GET.DOB)
          // let gender = await this.runAndReadAllByteToString(this.card, COMMAND.GET.GENDER)
          // let expireDate = await this.runAndReadAllByteToString(this.card, COMMAND.GET.EXPIRE_DATE)
          // let issueDate = await this.runAndReadAllByteToString(this.card, COMMAND.GET.ISSUE_DATE)
          // let issuer = await this.runAndReadAllByteToString(this.card, COMMAND.GET.ISSUER, isThai)
          // let address = await this.runAndReadAllByteToString(this.card, COMMAND.GET.ADDRESS, isThai)
          // let photoArray = await this.readPhoto(this.card)

          // enFullName = this.sharpToSpace(enFullName).trim()
          // thFullName = this.sharpToSpace(thFullName).trim()
          // address = this.sharpToSpace(address).trim()
          // issuer = this.sharpToSpace(issuer).trim()

          // // Return Person Object
          // person.setCID(cid)
          // person.setNameEN(enFullName)
          // person.setNameTH(thFullName)
          // person.setDoB(dob)
          // person.setGender(gender)
          // person.setAddress(address)
          // person.setExpireDate(expireDate)
          // person.setIssueDate(issueDate)
          // person.setIssuer(issuer)
          // person.setPhoto(photoArray)
          // this.emit('card-readed', person)

        } catch (err) { this.emit('error', err) }
      })
      this.device.on('card-removed', event => this.emit('card-removed', event))
    })
  }
}

module.exports = Reader
