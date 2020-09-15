export class ClaraExistenceError extends Error {
	constructor(message) {
		super(message)

		this.code = 'CLARA_EXISTENCE_ERROR'
		this.info = 'The key you provided doesn\'t exist in the memory'
	}
}

export class ClaraKeyExpired extends Error {
	constructor(message) {
		super(message)

		this.code = 'CLARA_KEY_EXPIRED'
		this.info = 'The key you provided expired and got omitted'
	}
}

export class ClaraUniqueValueError extends Error {
	constructor(message) {
		super(message)

		this.code = 'CLARA_UNIQUE_VALUE_ERROR'
		this.info = 'The value entered is not unique as requested'
	}
}

export class ClaraConfigurationError extends Error {
	constructor(message) {
		super(message)

		this.code = 'CLARA_CONFIGURATION_ERROR'
		this.info = 'The type of value you passed to this option is invalid'
	}
}