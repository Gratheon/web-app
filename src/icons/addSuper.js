import React from 'react'

export default ({ size = 16, onClick = () => {} }) => (
	<svg
		onClick={onClick}
		height={size}
		width={size}
		xmlns="http://www.w3.org/2000/svg"
		className="h-6 w-6"
		fill="none"
		viewBox="0 0 24 24"
	>
		<path fill="currentColor" d="M22 7h-5V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v5H2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM3 9h4v12H3zm6-1V3h6v18h-2v-2a1 1 0 0 0-2 0v2H9zm12 13h-4V9h4zM13 7h-2V5h2zm0 4h-2V9h2zm0 4h-2v-2h2zm-9-5h2v2H4zm0 4h2v2H4zm0 4h2v2H4zm16-6h-2v-2h2zm0 4h-2v-2h2zm0 4h-2v-2h2z"/>
	</svg>
)