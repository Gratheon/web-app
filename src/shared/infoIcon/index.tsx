import { useState, useEffect, useRef } from 'react'

interface InfoIconProps {
	children: React.ReactNode
	size?: number
}

export default function InfoIcon({ children, size = 16 }: InfoIconProps) {
	const [showTooltip, setShowTooltip] = useState(false)
	const [positionAbove, setPositionAbove] = useState(false)
	const [isMobileLayout, setIsMobileLayout] = useState(false)
	const [mobileTop, setMobileTop] = useState<number | null>(null)
	const [mobileBottom, setMobileBottom] = useState<number | null>(null)
	const [arrowLeftPx, setArrowLeftPx] = useState<number>(0)
	const tooltipRef = useRef<HTMLDivElement>(null)
	const iconRef = useRef<HTMLSpanElement>(null)

	useEffect(() => {
		if (!showTooltip) return

		const handleClickOutside = (event: MouseEvent) => {
			if (
				tooltipRef.current &&
				iconRef.current &&
				!tooltipRef.current.contains(event.target as Node) &&
				!iconRef.current.contains(event.target as Node)
			) {
				setShowTooltip(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showTooltip])

	useEffect(() => {
		if (!showTooltip || !iconRef.current) return

		const updateTooltipLayout = () => {
			if (!iconRef.current) return

			const iconRect = iconRef.current.getBoundingClientRect()
			const viewportHeight = window.innerHeight
			const viewportWidth = window.innerWidth
			const spaceBelow = viewportHeight - iconRect.bottom
			const tooltipEstimatedHeight = 300
			const shouldPositionAbove = spaceBelow < tooltipEstimatedHeight && iconRect.top > tooltipEstimatedHeight
			const mobileLayout = viewportWidth <= 768
			const iconCenterX = Math.max(12, Math.min(viewportWidth - 12, iconRect.left + iconRect.width / 2))

			setPositionAbove(shouldPositionAbove)
			setIsMobileLayout(mobileLayout)
			setArrowLeftPx(iconCenterX)

			if (mobileLayout) {
				if (shouldPositionAbove) {
					setMobileBottom(viewportHeight - iconRect.top + 8)
					setMobileTop(null)
				} else {
					setMobileTop(iconRect.bottom + 8)
					setMobileBottom(null)
				}
			}
		}

		updateTooltipLayout()
		window.addEventListener('resize', updateTooltipLayout)
		window.addEventListener('scroll', updateTooltipLayout, true)

		return () => {
			window.removeEventListener('resize', updateTooltipLayout)
			window.removeEventListener('scroll', updateTooltipLayout, true)
		}
	}, [showTooltip])

	return (
		<span style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}>
			<span
				ref={iconRef}
				onClick={(e) => {
					e.stopPropagation()
					setShowTooltip(!showTooltip)
				}}
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
					ref={tooltipRef}
					style={{
						position: isMobileLayout ? 'fixed' : 'absolute',
						...(positionAbove ? (isMobileLayout ? {
							bottom: `${mobileBottom ?? 0}px`
						} : {
							bottom: '100%',
							marginBottom: '8px'
						}) : (isMobileLayout ? {
							top: `${mobileTop ?? 0}px`
						} : {
							top: '100%',
							marginTop: '8px'
						})),
						...(isMobileLayout ? {
							left: 0,
							right: 0,
							maxWidth: '100vw',
							minWidth: '100vw',
							width: '100vw',
							transform: 'none',
							boxSizing: 'border-box'
						} : {
							left: '50%',
							transform: 'translateX(-50%)'
						}),
						padding: '12px 16px',
						background: '#fff',
						border: '1px solid #ddd',
						borderRadius: isMobileLayout ? 0 : '8px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						zIndex: 10000,
						minWidth: isMobileLayout ? undefined : '300px',
						maxWidth: isMobileLayout ? undefined : '400px',
						fontSize: '14px',
						lineHeight: '1.6',
						color: '#333'
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{positionAbove ? (
						<>
							<div
								style={{
									position: 'absolute',
									bottom: '-6px',
									left: isMobileLayout ? `${arrowLeftPx}px` : '50%',
									transform: 'translateX(-50%)',
									width: 0,
									height: 0,
									borderLeft: '6px solid transparent',
									borderRight: '6px solid transparent',
									borderTop: '6px solid #ddd'
								}}
							/>
							<div
								style={{
									position: 'absolute',
									bottom: '-5px',
									left: isMobileLayout ? `${arrowLeftPx}px` : '50%',
									transform: 'translateX(-50%)',
									width: 0,
									height: 0,
									borderLeft: '6px solid transparent',
									borderRight: '6px solid transparent',
									borderTop: '6px solid #fff'
								}}
							/>
						</>
					) : (
						<>
							<div
								style={{
									position: 'absolute',
									top: '-6px',
									left: isMobileLayout ? `${arrowLeftPx}px` : '50%',
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
									left: isMobileLayout ? `${arrowLeftPx}px` : '50%',
									transform: 'translateX(-50%)',
									width: 0,
									height: 0,
									borderLeft: '6px solid transparent',
									borderRight: '6px solid transparent',
									borderBottom: '6px solid #fff'
								}}
							/>
						</>
					)}
					{children}
				</div>
			)}
		</span>
	)
}
