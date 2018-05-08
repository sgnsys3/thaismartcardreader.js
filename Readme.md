# Thai Smart Card Reader.js
This is implementation of [smartcard](https://github.com/tomkp/smartcard) node js module. That using PCSC API.

## Installation
```
yarn add thaismartcard.js
```

## Example Code
---
Now we have 4 event type

1. device-activated
2. device-deactivated
3. card_inserted
3. card_readed
4. error

```
const { Reader } = require('thaismartcard.js')

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
```

## Credit
---
[Chakphanu](https://github.com) for an [APDU Command](https://github.com/chakphanu/ThaiNationalIDCard/blob/master/APDU.md)