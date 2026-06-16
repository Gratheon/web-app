self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		const clients = await self.clients.matchAll({
			type: 'window',
			includeUncontrolled: true,
		})

		clients.forEach((client) => {
			client.navigate(client.url)
		})
	})())
})
