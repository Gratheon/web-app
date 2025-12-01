import { useState, useRef, useEffect } from 'preact/hooks'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUploadContext } from '@/contexts/UploadContext'
import T from '@/shared/translate'
import styles from './index.module.less'

export default function MinimizedUploadProgress() {
	const { isUploading, images, uploadProgress, boxId, hiveId, apiaryId, cancelUpload } = useUploadContext()
	const navigate = useNavigate()
	const location = useLocation()
	const [position, setPosition] = useState({ x: 20, y: 100 })
	const [isDragging, setIsDragging] = useState(false)
	const dragRef = useRef<HTMLDivElement>(null)
	const dragOffset = useRef({ x: 0, y: 0 })

	useEffect(() => {
		if (!isDragging) return

		const handleMouseMove = (e: MouseEvent) => {
			setPosition({
				x: e.clientX - dragOffset.current.x,
				y: e.clientY - dragOffset.current.y,
			})
		}

		const handleMouseUp = () => {
			setIsDragging(false)
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging])

	const handleMouseDown = (e: MouseEvent) => {
		if (dragRef.current) {
			const rect = dragRef.current.getBoundingClientRect()
			dragOffset.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			}
			setIsDragging(true)
		}
	}

	const handleReturnToBox = () => {
		if (boxId && hiveId && apiaryId) {
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`)
		}
	}

	const handleCancel = () => {
		if (confirm('Are you sure you want to cancel the upload?')) {
			cancelUpload()
		}
	}

	if (!isUploading) return null

	const isOnBoxView = location.pathname.includes(`/box/${boxId}`)

	if (isOnBoxView) return null

	const completedCount = images.filter(img => img.uploaded).length
	const errorCount = images.filter(img => img.error).length
	const totalCount = images.length

	return (
		<div
			ref={dragRef}
			className={styles.minimizedProgress}
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				cursor: isDragging ? 'grabbing' : 'grab',
			}}
			onMouseDown={handleMouseDown}
		>
			<div className={styles.minimizedHeader}>
				<div className={styles.minimizedTitle}>
					<T>Uploading frames</T>
				</div>
				<div className={styles.minimizedActions}>
					<button onClick={handleReturnToBox} className={styles.minimizedButton}>
						↩
					</button>
					<button onClick={handleCancel} className={styles.minimizedButton}>
						×
					</button>
				</div>
			</div>
			<div className={styles.minimizedBody}>
				<div className={styles.minimizedProgress}>
					<div className={styles.progressBar}>
						<div
							className={styles.progressFill}
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
					<div className={styles.progressText}>
						{completedCount} / {totalCount} <T>completed</T>
						{errorCount > 0 && (
							<span className={styles.errorCount}> ({errorCount} <T>errors</T>)</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

