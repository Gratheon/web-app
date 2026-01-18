import { useState } from 'react'

interface InfoIconProps {
	children: React.ReactNode
	size?: number
}

export default function InfoIcon({ children, size = 16 }: InfoIconProps) {
	const [showTooltip, setShowTooltip] = useState(false)

	return (
		<span style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}>
			<span
				onClick={() => setShowTooltip(!showTooltip)}
				onMouseEnter={() => setShowTooltip(true)}
				onMouseLeave={() => setShowTooltip(false)}
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: `${size}px`,
					height: `${size}px`,
					borderRadius: '50%',
					background: '#2196f3',
					color: 'white',
					fontSize: `${size * 0.75}px`,
					fontWeight: 'bold',
					cursor: 'pointer',
					userSelect: 'none',
					verticalAlign: 'middle'
				}}
				title="Click for more information"
			>
				i
			</span>

			{showTooltip && (
				<div
					style={{
						position: 'absolute',
						top: '100%',
						left: '50%',
						transform: 'translateX(-50%)',
						marginTop: '8px',
						padding: '12px 16px',
						background: '#fff',
						border: '1px solid #ddd',
						borderRadius: '8px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						zIndex: 10000,
						minWidth: '300px',
						maxWidth: '400px',
						fontSize: '14px',
						lineHeight: '1.6',
						color: '#333'
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						style={{
							position: 'absolute',
							top: '-6px',
							left: '50%',
							transform: 'translateX(-50%)',
							width: 0,
							height: 0,
							borderLeft: '6px solid transparent',
							borderRight: '6px solid transparent',
							borderBottom: '6px solid #ddd'
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: '-5px',
							left: '50%',
							transform: 'translateX(-50%)',
							width: 0,
							height: 0,
							borderLeft: '6px solid transparent',
							borderRight: '6px solid transparent',
							borderBottom: '6px solid #fff'
						}}
					/>
					{children}
				</div>
			)}
		</span>
	)
}

