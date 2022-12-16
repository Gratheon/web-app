// var request = window.indexedDB.open('gratheon-app-db', 3);
// var db;
// request.onerror = function (event) {
// 	console.error(event);
// };
// request.onsuccess = function (event) {
// 	db = event.target.result;
// };
//
// request.onupgradeneeded = function (event) {
// 	var db = event.target.result;
//
// 	var boxesStore = db.createObjectStore(
// 		'boxes', { keyPath: 'myKey' }
// 	);
//
// 	boxesStore.createIndex("name", "name", { unique: false });
// };

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
