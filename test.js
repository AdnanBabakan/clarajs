import Storage from './app/Storage.js'

let storage = new Storage

storage.errorsOff()

storage.set('userOne', 'adnan', { uniqueValue: true })
storage.set('userTwo', 'adnan', { uniqueValue: true })
storage.set('userThree', 'arian', { uniqueValue: true })
console.log(storage.getDataSet())