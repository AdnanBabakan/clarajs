import Storage from './app/Storage.js'

let storage = new Storage

storage.errorsOff()

storage.set('userOne', 'adnan', { expiresIn: 10 })
console.log(storage.get('userOne'))

setTimeout(() => console.log(storage.get('userOne')), 1000)