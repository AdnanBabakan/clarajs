import Storage from './app/Storage.js'

let storage = new Storage

storage.set('test', 'Hallo')
console.log(storage.getDataSet())
storage.importFromDiskSync(false)
console.log(storage.getDataSet())