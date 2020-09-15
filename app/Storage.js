import { ClaraExistenceError, ClaraKeyExpired, ClaraConfigurationError, ClaraUniqueValueError } from './Errors.js'
import i4h from 'intervals-for-humans'
import md5 from 'md5'
import fs from 'fs'

export default class Storage {
	#data = {}
	#diskFile = 'clara.json'
	#errors = true

	errorsOn() {
		this.#errors = true
	}

	errorsOff() {
		this.#errors = false
	}

	set(key, value, options = {}) {
		if (options.encodeKey) key = md5(key + '' + (options.keySalt ? options.keySalt : ''))
		if (options.encodeValue) value = md5(value)

		if (options.uniqueValue) {
			for (const prop in this.#data) {
				if (this.#data[prop].value === value)
					if (this.#errors) throw new ClaraUniqueValueError(`The '${value}' is not a unique value`)
			}
		}

		this.#data[key] = {
			value,
			options: {}
		}

		if (options.expiresIn) {
			if (typeof options.expiresIn === 'string'
				|| typeof options.expiresIn === 'number')
				this.#data[key].options.expiresIn = (Date.now()) +
					(typeof options.expiresIn === 'string' ? i4h(options.expiresIn) : options.expiresIn)
			else if (this.#errors) throw new ClaraConfigurationError('The type of expiresIn should be string or number')
		}

		if (options.limit) {
			if (typeof options.limit === 'number' && options.limit > 0) this.#data[key].options.limit = options.limit
			else if (this.#errors) throw new ClaraConfigurationError('The type of limit should be number and larger than 0')
		}

		if (Object.entries(this.#data[key].options).length === 0) delete this.#data[key].options
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

	isExpired(key) {
		if (this.#data[key].options.expiresIn && this.#data[key].options.expiresIn < Date.now()) {
			delete this.#data[key]
			return true
		} else return false
	}

	getDataSet() {
		for(const prop in this.#data) {
			this.isExpired(prop)
		}

		return this.#data
	}

	get(key, options) {
		if (options) {
			if (options.encodedKey) key = md5(key + '' + (options.salt ? options.salt : ''))
		}
		const thisData = this.#data[key]
		if (thisData) {
			if (!thisData.hasOwnProperty('options')) thisData.options = {}

			if(thisData.options.expiresIn) {
				if(this.isExpired(key)) {
					if(this.#errors) return new ClaraKeyExpired(`The '${key}' expired and got omitted`)
					else return undefined
				}
			}

			if (thisData.options.limit) {
				let tempValue = this.#data[key].value
				if (--thisData.options.limit === 0) delete this.#data[key]
				return tempValue
			}

			return thisData.value
		} else if (this.#errors) throw new ClaraExistenceError(`The '${key}' key doesn't exist`)
		else return undefined
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
				switch (merge) {
					case 'DISK_PRIOR':
						dataToBeWritten = { ...this.#data, ...(fileData ? JSON.parse(fileData) : {}) }
						break
					case 'MEMORY_PRIOR':
					default:
						dataToBeWritten = { ...(fileData ? JSON.parse(fileData) : {}), ...this.#data }
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
			switch (merge) {
				case 'DISK_PRIOR':
					dataToBeWritten = { ...this.#data, ...(fileData ? JSON.parse(fileData) : {}) }
					break
				case 'MEMORY_PRIOR':
				default:
					dataToBeWritten = { ...(fileData ? JSON.parse(fileData) : {}), ...this.#data }
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
				switch (merge) {
					case 'DISK_PRIOR':
						dataToBeSet = { ...this.#data, ...(fileData ? JSON.parse(fileData) : {}) }
						break
					case 'MEMORY_PRIOR':
					default:
						dataToBeSet = { ...(fileData ? JSON.parse(fileData) : {}), ...this.#data }
				}
				this.#data = dataToBeSet
			} else this.#data = fileData ? JSON.parse(fileData) : {}
			callback(err)
		})
	}

	importFromDiskSync(merge = 'MEMORY_PRIOR') {
		let fileData = fs.readFileSync(this.#diskFile, 'UTF-8')
		if (merge) {
			let dataToBeSet
			switch (merge) {
				case 'DISK_PRIOR':
					dataToBeSet = { ...this.#data, ...JSON.parse(fileData ? fileData : '{}') }
					break
				case 'MEMORY_PRIOR':
				default:
					dataToBeSet = { ...JSON.parse(fileData ? fileData : '{}'), ...this.#data }
			}
			this.#data = dataToBeSet
		} else this.#data = fileData ? JSON.parse(fileData) : {}
	}
}