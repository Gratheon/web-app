export const mobileStyles = {
	container: (isMobile: boolean) => ({
		width: '100%',
		userSelect: 'none' as const,
		WebkitUserSelect: 'none' as const,
		WebkitTouchCallout: 'none' as const,
		...(isMobile && {
			paddingBottom: '20px'
		})
	}),

	header: (isMobile: boolean) => ({
		marginBottom: '20px',
		padding: isMobile ? '0 10px' : '0 20px'
	}),

	description: (isMobile: boolean) => ({
		fontSize: isMobile ? '13px' : '14px',
		color: '#666'
	}),

	selectionIndicator: (isMobile: boolean) => ({
		position: 'fixed' as const,
		bottom: isMobile ? '20px' : '40px',
		left: '50%',
		transform: 'translateX(-50%)',
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		color: 'white',
		padding: isMobile ? '12px 20px' : '10px 16px',
		borderRadius: '20px',
		fontSize: isMobile ? '16px' : '14px',
		fontWeight: 'bold',
		zIndex: 1000,
		pointerEvents: 'none' as const,
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
	})
}

