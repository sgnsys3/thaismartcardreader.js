const fs = require('fs')
const {
  Reader
} = require('../src')
const path = require('path')

const myReader = new Reader()

process.on('unhandledRejection', (reason) => {
  console.log('From Global Rejection -> Reason: ' + reason);
});

console.log('Waiting For Device !')
myReader.on('device-activated', async (event) => {
  console.log('Device-Activated')
  console.log(event.name)
  console.log('=============================================')
})

myReader.on('error', async (err) => {
  console.log(err)
})

myReader.on('image-reading', (percent) => {
  console.log(percent)
})

myReader.on('card-inserted', async (person) => {
  const cid = await person.getCid()
  const thName = await person.getNameTH()
  const enName = await person.getNameEN()
  const dob = await person.getDoB()
  const issueDate = await person.getIssueDate()
  const expireDate = await person.getExpireDate()
  const address = await person.getAddress()
  const issuer = await person.getIssuer()

  console.log(`CitizenID: ${cid}`)
  console.log(`THName: ${thName.prefix} ${thName.firstname} ${thName.lastname}`)
  console.log(`ENName: ${enName.prefix} ${enName.firstname} ${enName.lastname}`)
  console.log(`DOB: ${dob.day}/${dob.month}/${dob.year}`)
  console.log(`Address: ${address}`)
  console.log(`IssueDate: ${issueDate.day}/${issueDate.month}/${issueDate.year}`)
  console.log(`Issuer: ${issuer}`)
  console.log(`ExpireDate: ${expireDate.day}/${expireDate.month}/${expireDate.year}`)

  console.log('=============================================')
  console.log('Receiving Image')
  const photo = await person.getPhoto()
  console.log(`Image Saved to ${path.resolve('')}/${cid}.bmp`)
  console.log('=============================================')
  const fileStream = fs.createWriteStream(`${cid}.bmp`)
  const photoBuff = Buffer.from(photo)
  fileStream.write(photoBuff)
  fileStream.close()
})

myReader.on('device-deactivated', () => {
  console.log('device-deactivated')
})