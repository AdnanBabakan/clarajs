import Storage from './app/Storage.js'

let storage = new Storage

storage.set('userOne', 'Hallo')
console.log(storage.getDataSet())
storage.importFromDiskSync()
console.log(storage.getDataSet())