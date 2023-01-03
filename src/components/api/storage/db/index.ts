export default {
	get: (key) => {
		if (typeof window == 'undefined') {
			return []
		}
		let list = window.localStorage.getItem(key)
		if (!list) {
			return []
		}
		// window.store[key] = list;
		return JSON.parse(list)
	},
	set: (key, value) => {
		if (typeof window == 'undefined') {
			return
		}
		window.localStorage.setItem(key, JSON.stringify(value))
	},
}
