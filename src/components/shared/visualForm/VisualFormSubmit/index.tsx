import React from 'react'

export default ({ children }) => {
	return (
		<div>
			<div></div>
			<div style="text-align:right;display:flex;flex-direction: row-reverse;">
				{children}
			</div>
		</div>
	)
}
