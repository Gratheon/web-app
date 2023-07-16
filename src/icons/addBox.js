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
		<path fill="currentColor" d="m22.948 10.684-3-9A1 1 0 0 0 19 1H5a1 1 0 0 0-.948.684l-3 9A1.229 1.229 0 0 0 1 11v11a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1c0-.1-.008-11.127 0-11.027a.987.987 0 0 0-.052-.289zM5.721 3h12.558l2.333 7h-3.2l-4.705-4.707a1 1 0 0 0-1.414 0L6.586 10h-3.2zM11 21v-5h2v5zm10 0h-6v-6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v6H3v-9h4a1 1 0 0 0 .707-.293L12 7.414l4.293 4.293A1 1 0 0 0 17 12h4zm-8-10a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm-9 3h4v2H4zm12 0h4v2h-4zM4 17h4v2H4zm12 0h4v2h-4z"/>
	</svg>
)