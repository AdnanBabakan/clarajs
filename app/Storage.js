import { ClaraExistenceError, ClaraKeyExpired, ClaraConfigurationError } from './Errors.js'
import i4h from 'intervals-for-humans'
import md5 from 'md5'
import fs from 'fs'

export default class Storage {
	#data = {}
	#diskFile = 'clara.json'

	set(key, value, options) {
		if (!options) this.#data[key] = value
		else {
			if (options.encodeKey) key = md5(key + '' + (options.salt ? options.salt : ''))

			this.#data[key] = {
				value: options.encodeValue ? md5(value) : value,
				options: {}
			}

			if (options.expiresIn) {
				if (typeof options.expiresIn === 'string'
					|| typeof options.expiresIn === 'number')
					this.#data[key].options.expiresIn = (Date.now()) +
						(typeof options.expiresIn === 'string' ? i4h(options.expiresIn) : options.expiresIn)
				else throw new ClaraConfigurationError('The type of expiresIn should be string or number')
			}

			if (options.limit) {
				if (typeof options.limit === 'number' && options.limit > 0) this.#data[key].options.limit = options.limit
				else throw new ClaraConfigurationError('The type of limit should be number and larger than 0')
			}
		}
	}

	setIfDoesntExist(key, value, options) {
		let encodedKey = false
		if (options) {
			if (options.encodeKey) {
				key = md5(key + '' + (options.salt ? options.salt : ''))
				encodedKey = true
			}
		}

		if (!this.exists(key, { encodedKey })) this.set(key, value, options)
	}

	getDataSet() {
		return this.#data
	}

	get(key, options) {
		if (options) {
			if (options.encodedKey) key = md5(key + '' + (options.salt ? options.salt : ''))
		}
		const thisData = this.#data[key]
		if (thisData) {
			if (!thisData.hasOwnProperty('options')) return thisData
			else {
				if (!thisData.hasOwnProperty('options')) thisData.options = {}

				if (thisData.options.expiresIn && thisData.options.expiresIn < Date.now()) {
					delete this.#data[key]
					return new ClaraKeyExpired(`The '${key}' expired and got omitted`)
				}

				if (thisData.options.limit) {
					let tempValue = this.#data[key].value
					if (--thisData.options.limit === 0) delete this.#data[key]
					return tempValue
				}

				return thisData.value
			}
		} else throw new ClaraExistenceError(`The '${key}' key doesn't exist`)
	}

	exists(key, options) {
		if (options) {
			if (options.encodedKey) key = md5(key + '' + (options.salt ? options.salt : ''))
		}

		return this.#data.hasOwnProperty(key)
	}

	omit(key, options) {
		if (options) {
			if (options.encodedKey) key = md5(key + '' + (options.salt ? options.salt : ''))
		}

		delete this.#data[key]
	}

	writeToDisk(merge = 'MEMORY_PRIOR', callback) {
		if (merge) {
			fs.readFile(this.#diskFile, 'UTF-8', (err, fileData) => {
				if (rr) throw err
				let dataToBeWritten
				switch(merge) {
					case 'FILE_PRIOR':
						dataToBeWritten = { ...this.#data, ...JSON.parse(fileData ? fileData : '{}') }
						break
					case 'MEMORY_PRIOR':
					default:
						dataToBeWritten = { ...JSON.parse(fileData ? fileData : '{}'), ...this.#data }
				}
				fs.writeFile(file, JSON.stringify(dataToBeWritten, null, '\t'), 'UTF-8', err => {
					callback(err)
				})
			})
		} else {
			fs.writeFile(this.#diskFile, JSON.stringify(this.#data, null, '\t'), 'UTF-8', err => {
				callback(err)
			})
		}
	}

	writeToDiskSync(merge = 'MEMORY_PRIOR') {
		if (merge) {
			let fileData = fs.readFileSync(this.#diskFile, 'UTF-8')
			let dataToBeWritten
			switch(merge) {
				case 'FILE_PRIOR':
					dataToBeWritten = { ...this.#data, ...JSON.parse(fileData ? fileData : '{}') }
					break
				case 'MEMORY_PRIOR':
				default:
					dataToBeWritten = { ...JSON.parse(fileData ? fileData : '{}'), ...this.#data }
			}
			fs.writeFileSync(this.#diskFile, JSON.stringify(dataToBeWritten, null, '\t'), 'UTF-8')
		} else {
			fs.writeFileSync(this.#diskFile, JSON.stringify(this.#data, null, '\t'), 'UTF-8')
		}
	}

	importFromDisk(merge = 'MEMORY_PRIOR', callback) {
		fs.readFile(this.#diskFile, 'UTF-8', (err, fileData) => {
			if (merge) {
				let dataToBeSet
				switch(merge) {
					case 'FILE_PRIOR':
						dataToBeSet = { ...this.#data, ...JSON.parse(fileData ? fileData : '{}') }
						break
					case 'MEMORY_PRIOR':
					default:
						dataToBeSet = { ...JSON.parse(fileData ? fileData : '{}'), ...this.#data }
				}
				this.#data = dataToBeSet
			}
			else this.#data = JSON.parse(fileData)
			callback(err)
		})
	}

	importFromDiskSync(merge = 'MEMORY_PRIOR') {
		let fileData = fs.readFileSync(this.#diskFile, 'UTF-8')
		if (merge) {
			let dataToBeSet
			switch(merge) {
				case 'FILE_PRIOR':
					dataToBeSet = { ...this.#data, ...JSON.parse(fileData ? fileData : '{}') }
					break
				case 'MEMORY_PRIOR':
				default:
					dataToBeSet = { ...JSON.parse(fileData ? fileData : '{}'), ...this.#data }
			}
			this.#data = dataToBeSet
		}
		else this.#data = fileData
	}
}