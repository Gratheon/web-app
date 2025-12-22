export default function Bottom({ selected = false }) {
	return (
		<div
			className="bottom"
			style={{
				height: '20px',
				backgroundColor: selected ? '#999' : '#ccc',
				border: selected ? '2px solid #666' : '1px solid #aaa',
				borderRadius: '4px',
				width: '100%',
				boxSizing: 'border-box',
				cursor: 'pointer',
				transition: 'all 0.2s ease'
			}}
		/>
	)
}

