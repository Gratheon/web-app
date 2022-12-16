import React from 'react'

export default ({ children }) => {
	return (
		<div style={{ display: 'flex' }}>
			<div style={{ flexGrow: 1 }}></div>
			{children}
		</div>
	)
}
