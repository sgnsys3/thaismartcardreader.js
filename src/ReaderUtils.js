const {
  Devices,
  ResponseApdu,
  CommandApdu
} = require('smartcard')
const COMMAND = require('./APDUCommand')

runCommand = (card, apduCommand) => {
  return new Promise(async (resolve, reject) => {
    let rawResponse
    try {
      rawResponse = await card.issueCommand(new CommandApdu({
        bytes: apduCommand
      }))
    } catch (err) {
      reject(err)
    }
    let response = new ResponseApdu(rawResponse)
    resolve(response)
  })
}

runAndReadAllByte = (card, apduCommand) => {
  return new Promise(async (resolve, reject) => {
    try {
      let apduResponse = await runCommand(card, apduCommand)
      if (apduResponse.hasMoreBytesAvailable()) {
        let data = await getMoreByte(card, apduResponse)
        resolve(data)
      } else {
        if (apduResponse.isOk()) {
          resolve([])
        } else {
          reject(apduResponse.meaning())
        }
      }
    } catch (err) {
      reject(err)
    }
  })
}

runAndReadAllByteToString = (card, apduCommand, isThai = false) => {
  return new Promise(async (resolve, reject) => {
    let data = await runAndReadAllByte(card, apduCommand)
      .catch((err) => {
        reject(err)
      })
    if (isThai) {
      data = tis620ToUTF8(data)
    }
    let stringData = stringFromUTF8Array(data)
    resolve(stringData)
  })
}

getMoreByte = (card, apduResponse, inheritMoreByte = []) => {
  let moreByte = inheritMoreByte
  return new Promise(async (resolve, reject) => {
    let numOfAvaiableData = apduResponse.numberOfBytesAvailable()
    try {
      let moreByteResponse = await runCommand(card, [...COMMAND.GET.RESPONSE, numOfAvaiableData])
      moreByte.push(...moreByteResponse.buffer)
      if (moreByteResponse.hasMoreBytesAvailable()) {
        await getMoreByte(card, moreByteResponse, moreByte)
      }
      resolve(moreByte.splice(0, moreByte.length - 2))
    } catch (err) {
      reject(err)
    }
  })
}

stringFromUTF8Array = (data = []) => {
  const stringArray = data.map(item => String.fromCharCode(item))
  return stringArray.join('')
}

sharpToSpace = (data = "") => {
  return data.replace(/#/g, ' ')
}

tis620ToUTF8 = (data = []) => {
  let returnData = data.map(item => {
    if (item > 0 && item < 65) {
      return item
    } else {
      return item - 161 + 3585
    }
  })
  return returnData
}

readPhoto = (card, reader) => {
  return new Promise(async (resolve, reject) => {
    let collectArray = []
    for (let i = 0; i < 20; i++) {
      let part = await runAndReadAllByte(card, COMMAND.GET.PHOTO[i])
      collectArray.push(...part)
      reader.emit('image-reading', `${(i + 1) * 5}%`)
    }
    resolve(collectArray)
  })
}

initCard = async (card) => {
  await runCommand(card, COMMAND.MOI)
}

module.exports = {
  runAndReadAllByte,
  runAndReadAllByteToString,
  runCommand,
  getMoreByte,
  stringFromUTF8Array,
  sharpToSpace,
  tis620ToUTF8,
  readPhoto,
  initCard
}