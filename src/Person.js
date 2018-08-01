'use strict'
const { EventEmitter } = require('events')
const ReaderUtils = require('./ReaderUtils')
const APDU = require('./APDUCommand')

class Person extends EventEmitter {
  constructor(card, reader) {
    super()
    this._allData = {
      cid: null,
      name: {
        en: {
          prefix: null,
          firstname: null,
          lastname: null
        },
        th: {
          prefix: null,
          firstname: null,
          lastname: null
        }
      },
      address: null,
      issuer: null,
      gender: null,
      dob: {
        year: null,
        month: null,
        day: null,
      },
      expireDate: {
        year: null,
        month: null,
        day: null,
      },
      issueDate: {
        year: null,
        month: null,
        day: null,
      },
      photo: null,
      first4CodeUnderPicture: null,
      last8CodeUnderPicture: null,
    }
    this._card = card
    this._reader = reader
  }

  setCid(cid) {
    this._allData.cid = cid
  }

  setFirst4CodeUnderPicture(first4Digit) {
    this._allData.first4CodeUnderPicture = first4Digit
  }

  setLast8CodeUnderPicture(last8Digit) {
    this._allData.last8CodeUnderPicture = last8Digit
  }

  setNameTH(name = '') {
    this._allData.name.th = this.extractName(name)
  }

  setNameEN(name = '') {
    this._allData.name.en = this.extractName(name)
  }

  setAddress(address = '') {
    this._allData.address = address
  }

  setIssuer(issuer = '') {
    this._allData.issuer = issuer
  }

  setGender(gender = '') {
    if (gender == '1') gender = 'Male'
    else if (gender == '2') gender = 'Female'
    this._allData.gender = gender
  }

  setDoB(dob) {
    if(typeof dob == 'string') {
      dob = this.extractDateToObject(dob)
    }
    this._allData.dob = dob
  }

  setIssueDate(issueDate) {
    if (typeof issueDate == 'string') {
      issueDate = this.extractDateToObject(issueDate)
    }
    this._allData.issueDate = issueDate
  }

  setExpireDate(expireDate) {
    if (typeof expireDate == 'string') {
      expireDate = this.extractDateToObject(expireDate)
    }
    this._allData.expireDate = expireDate
  }

  setPhoto(photo = []) {
    this._allData.photo = photo
  }

  async getCid () {
    if (this._allData.cid == null) {
      this.setCid((await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.CID)).substring(0, 13))
    }
    return this._allData.cid
  }

  async getFirst4CodeUnderPicture () {
    if (this._allData.first4CodeUnderPicture == null) {
      this.setFirst4CodeUnderPicture((await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.FIRST_4_CODE_UNDERPICTURE)))
    }
    return this._allData.first4CodeUnderPicture
  }

  async getLast8CodeUnderPicture () {
    if (this._allData.last8CodeUnderPicture == null) {
      this.setLast8CodeUnderPicture((await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.LAST_8_CODE_UNDERPICTURE)))
    }
    return this._allData.last8CodeUnderPicture
  }

  async getNameEN() {
    if (
      this._allData.name.en.prefix == null ||
      this._allData.name.en.firstname == null ||
      this._allData.name.en.lastname == null
    ) {
      this.setNameEN(ReaderUtils.sharpToSpace(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.EN_FULLNAME)).trim())
    }
    return this._allData.name.en
  }

  async getNameTH() {
    if (
      this._allData.name.th.prefix == null ||
      this._allData.name.th.firstname == null ||
      this._allData.name.th.lastname == null
    ) {
      this.setNameTH(ReaderUtils.sharpToSpace(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.TH_FULLNAME, true)).trim())
    }
    return this._allData.name.th
  }

  async getAddress() {
    if (this._allData.address == null) {
      this.setAddress(ReaderUtils.sharpToSpace(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.ADDRESS, true)).trim())
    }
    return this._allData.address
  }

  async getIssuer() {
    if (this._allData.issuer == null) {
      this.setIssuer(ReaderUtils.sharpToSpace(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.ISSUER, true)).trim())
    }
    return this._allData.issuer
  }

  async getGender() {
    if (this._allData.gender == null) {
      this.setGender(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.GENDER))
    }
    return this._allData.gender
  }

  async getDoB() {
    if (
      this._allData.dob.year == null ||
      this._allData.dob.month == null ||
      this._allData.dob.day == null
    ) {
      this.setDoB(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.DOB))
    }
    return this._allData.dob
  }

  async getExpireDate() {
    if (
      this._allData.expireDate.year == null ||
      this._allData.expireDate.month == null ||
      this._allData.expireDate.day == null
    ) {
      this.setExpireDate(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.EXPIRE_DATE))
    }
    return this._allData.expireDate
  }

  async getIssueDate() {
    if (
      this._allData.issueDate.year == null ||
      this._allData.issueDate.month == null ||
      this._allData.issueDate.day == null
    ) {
      this.setIssueDate(await ReaderUtils.runAndReadAllByteToString(this._card, APDU.GET.ISSUE_DATE))
    }
    return this._allData.issueDate
  }

  async getPhoto() {
    if(this._allData.photo == null) {
      this.setPhoto(await ReaderUtils.readPhoto(this._card, this._reader))
    }
    return this._allData.photo
  }


  extractName(name = '') {
    const extractedName = name.split(/\s+/g)
    return {
      prefix: extractedName[0],
      firstname: extractedName[1],
      lastname: extractedName[2]
    }
  }

  extractDateToObject(dateString) {
    let obj = {
      year: "",
      month: "",
      day: "",
    }
    obj.year = dateString.substr(0, 4)
    obj.month = dateString.substr(4, 2)
    obj.day = dateString.substr(6, 2)
    return obj
  }
}

module.exports = Person