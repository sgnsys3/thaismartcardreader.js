# Thai Smart Card Reader.js
This is implementation of [smartcard](https://github.com/tomkp/smartcard) node js module. That using PCSC API.

## Installation
```
yarn add thaismartcardreader.js
```

## Deprecated
1. "card-readed" event from Reader class using "card-inserted" instead
2. Access variable directly eg. person.cid using getter function by add prefix "get" and using camelCase eg getCid, getDoB

## Example Code
You can find it in demo/GetAllData.js

## API Document
Comming Soon in Version 0.3

## Credit
[Chakphanu](https://github.com/chakphanu) for an [APDU Command](https://github.com/chakphanu/ThaiNationalIDCard/blob/master/APDU.md)