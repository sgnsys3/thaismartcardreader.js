'use strict'
const { EventEmitter } = require('events')

class Person extends EventEmitter {
  constructor() {
    super()
    this.cid = ''
    this.name = {
      en: '',
      th: '',
    }
  }

  getCID() {
    return this.cid
  }
  setCID(cid) {
    this.cid = cid
  }
  setNameEN(name) {
    this.name.en = name
  }
  setNameTH(name) {
    this.name.th = name
  }
}

module.exports = Person