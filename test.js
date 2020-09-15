import Storage from './app/Storage.js'

let storage = new Storage

storage.errorsOff()
storage.cacheModeOn()
storage.setCacheExpiresIn('1s')

storage.set('userOne', 'Adnan')
storage.set('userTwo', 'Tarlan')

console.log(storage.getDataSet())

setTimeout(() => console.log(storage.getDataSet()), 996)