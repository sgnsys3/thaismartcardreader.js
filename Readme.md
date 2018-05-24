# Thai Smart Card Reader.js
This is implementation of [smartcard](https://github.com/tomkp/smartcard) node js module. That using PCSC API.

## Installation
```
yarn add thaismartcard.js
```

## Example Code

```javascript
const fs = require('fs')
const { Reader } = require('thaismartcardreader.js')
const path = require('path')

const myReader = new Reader()

console.log('Waiting For Device !')
myReader.on('device-activated', async (event) => {
  console.log('Device-Activated')
  console.log(event.name)
  console.log('=============================================')
})

myReader.on('error', async (err) => {
  console.log(err)
})

myReader.on('card-readed', (person) => {
  console.log(`CitizenID: ${person.cid}`)  
  console.log(`ThaiName: ${person.name.th}`)
  console.log(`EnglishName: ${person.name.en}`)
  console.log(`DOB: ${person.dob.day}/${person.dob.month}/${person.dob.year}`)
  console.log(`Address: ${person.address}`)
  console.log(`IssueDate: ${person.issueDate.day}/${person.issueDate.month}/${person.issueDate.year}`)
  console.log(`Issuer: ${person.issuer}`)
  console.log(`ExpireDate: ${person.expireDate.day}/${person.expireDate.month}/${person.expireDate.year}`)
  console.log(`Image Saved to ${path.resolve('')}/${person.cid}.bmp`)
  console.log('=============================================')
  const fileStream = fs.createWriteStream(`${person.cid}.bmp`)
  const photoBuff = Buffer.from(person.photo)
  fileStream.write(photoBuff)
  fileStream.close()
})

myReader.on('device-deactivated', () => { console.log('device-deactivated') })
```

## Credit
[Chakphanu](https://github.com) for an [APDU Command](https://github.com/chakphanu/ThaiNationalIDCard/blob/master/APDU.md)