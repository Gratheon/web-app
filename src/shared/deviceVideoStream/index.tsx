import React, { useEffect, useRef, useState } from 'react'

import { gql, useUploadMutation } from '@/api'
import Button from '@/shared/button'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import { videoUploadUri } from '@/uri.ts'

import styles from './styles.module.less'

const UPLOAD_GATE_VIDEO_MUTATION = gql`
mutation uploadGateVideo($file: Upload!, $boxId: ID!) {
	uploadGateVideo(file: $file, boxId: $boxId)
}
`

function logDebug(message: string, payload?: any) {
	if (payload !== undefined) {
		console.log(`[DeviceVideoStream] ${message}`, payload)
		return
	}
	console.log(`[DeviceVideoStream] ${message}`)
}

export default function DeviceVideoStream({
	boxId,
}: {
	boxId?: string | number | null
}) {
	const videoRef = useRef<HTMLVideoElement | null>(null)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const timeoutRef = useRef<any>(null)
	const chunksRef = useRef<Blob[]>([])

	const [hasCameraPermission, setHasCameraPermission] = useState(false)
	const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState('')
	const [isCaptureStarted, setIsCaptureStarted] = useState(false)
	const [uploadState, setUploadState] = useState<'idle' | 'waiting' | 'ok' | 'fail'>('idle')

	const uploadMutation: any = useUploadMutation(UPLOAD_GATE_VIDEO_MUTATION, videoUploadUri())
	const uploadFile: any = uploadMutation[0]
	const uploadResponse: any = uploadMutation[1]?.data
	const uploadFileRef = useRef<any>(null)
	const SEGMENT_MS = 10_000
	const RESTART_MS = 1_000

	const canUpload = Boolean(boxId)

	useEffect(() => {
		uploadFileRef.current = uploadFile
		logDebug('upload mutation function ready')
	}, [uploadFile])

	useEffect(() => {
		logDebug('initializing camera capabilities', {
			hasMediaDevices: Boolean(navigator?.mediaDevices),
			hasGetUserMedia: Boolean(navigator?.mediaDevices?.getUserMedia),
			hasEnumerateDevices: Boolean(navigator?.mediaDevices?.enumerateDevices),
			hasMediaRecorder: typeof MediaRecorder !== 'undefined',
			boxId,
			canUpload,
		})

		const checkCameraPermission = async () => {
			try {
				// @ts-ignore browser support varies
				const permissionStatus = await navigator.permissions.query({ name: 'camera' })
				setHasCameraPermission(permissionStatus.state === 'granted')
				logDebug('camera permission status', permissionStatus.state)
			} catch (error) {
				console.error('Error checking camera permission:', error)
				logDebug('camera permission query failed', error)
			}
		}

		const getCameraDevices = async () => {
			try {
				const devices = await navigator.mediaDevices.enumerateDevices()
				const cameras = devices.filter((device) => device.kind === 'videoinput')
				logDebug('enumerated cameras', cameras.map((camera) => ({
					deviceId: camera.deviceId,
					label: camera.label,
				})))
				setCameraDevices(cameras)
				if (!selectedCameraDeviceId && cameras.length > 0) {
					setSelectedCameraDeviceId(cameras[0].deviceId)
				}
			} catch (error) {
				console.error('Error retrieving camera devices:', error)
				logDebug('camera enumeration failed', error)
			}
		}

		checkCameraPermission()
		getCameraDevices()
	}, [])

	useEffect(() => {
		if (!hasCameraPermission || !isCaptureStarted) return
		logDebug('capture effect entered', {
			hasCameraPermission,
			isCaptureStarted,
			selectedCameraDeviceId,
			boxId,
			canUpload,
		})

		const stopVideoCapture = () => {
			logDebug('stopVideoCapture invoked', {
				mediaRecorderState: mediaRecorderRef.current?.state || 'none',
			})
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
			if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
				mediaRecorderRef.current.stop()
			}
		}

		const startVideoCapture = async () => {
			try {
				if (typeof MediaRecorder === 'undefined') {
					logDebug('MediaRecorder is not available in this browser')
					setUploadState('fail')
					setIsCaptureStarted(false)
					return
				}

				logDebug('requesting camera stream', {
					selectedCameraDeviceId,
					canUpload,
					boxId,
				})
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: selectedCameraDeviceId ? { exact: selectedCameraDeviceId } : undefined,
					},
				})
				logDebug('camera stream acquired', {
					trackCount: stream.getTracks().length,
					trackLabels: stream.getTracks().map((track) => track.label),
				})

				if (videoRef.current) {
					videoRef.current.srcObject = stream
					logDebug('local preview attached')
				}

				if (!canUpload) {
					logDebug('upload disabled because device is not linked to a box')
					return
				}

				const recorder = new MediaRecorder(stream)
				mediaRecorderRef.current = recorder
				chunksRef.current = []
				setUploadState('waiting')
				logDebug('MediaRecorder started', {
					mimeType: recorder.mimeType,
					segmentMs: SEGMENT_MS,
				})

				recorder.ondataavailable = (event) => {
					if (event.data && event.data.size > 0) {
						chunksRef.current.push(event.data)
						logDebug('recorder chunk received', {
							chunkSize: event.data.size,
							chunkCount: chunksRef.current.length,
						})
					}
				}

				recorder.onstop = async () => {
					try {
						logDebug('recorder stopped', {
							chunkCount: chunksRef.current.length,
						})
						if (!canUpload || !boxId) {
							setUploadState('idle')
							logDebug('skipping upload because box is not linked')
							return
						}
						if (!chunksRef.current.length) {
							setUploadState('fail')
							logDebug('no chunks collected for upload')
							return
						}
						const blob = new Blob(chunksRef.current, { type: 'video/webm' })
						logDebug('uploading fragment', {
							boxId: `${boxId}`,
							size: blob.size,
							type: blob.type,
						})
						const response = await uploadFileRef.current({
							file: blob,
							boxId: `${boxId}`,
						})
						logDebug('upload response', response)
						setUploadState(response?.data?.uploadGateVideo ? 'ok' : 'fail')
					} catch (error) {
						console.error('Error uploading stream segment:', error)
						logDebug('upload failed', error)
						setUploadState('fail')
					} finally {
						chunksRef.current = []
						if (canUpload) {
							setUploadState('waiting')
							logDebug('scheduling next segment', { delayMs: RESTART_MS })
							timeoutRef.current = setTimeout(startVideoCapture, RESTART_MS)
						}
					}
				}

				recorder.start()
				logDebug('recorder.start() called')
				timeoutRef.current = setTimeout(stopVideoCapture, SEGMENT_MS)
			} catch (error) {
				console.error('Error accessing camera:', error)
				logDebug('camera access failed', error)
				setUploadState('fail')
				setIsCaptureStarted(false)
			}
		}

		startVideoCapture()
		return () => {
			logDebug('capture effect cleanup')
			stopVideoCapture()
		}
	}, [boxId, canUpload, hasCameraPermission, isCaptureStarted, selectedCameraDeviceId])

	useEffect(() => {
		if (!isCaptureStarted && videoRef.current?.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream
			stream.getTracks().forEach((track) => track.stop())
			videoRef.current.srcObject = null
			logDebug('capture stopped and preview tracks closed')
		}
	}, [isCaptureStarted])

	useEffect(() => {
		if (uploadResponse?.uploadGateVideo === true) {
			setUploadState('ok')
			logDebug('uploadResponse state indicates success')
		}
		if (uploadResponse?.uploadGateVideo === false) {
			setUploadState('fail')
			logDebug('uploadResponse state indicates failure')
		}
	}, [uploadResponse])

	const requestPermissions = async () => {
		try {
			logDebug('requesting camera permissions via getUserMedia')
			const stream = await navigator.mediaDevices.getUserMedia({ video: true })
			if (videoRef.current) {
				videoRef.current.srcObject = stream
			}
			setHasCameraPermission(true)
			logDebug('camera permission granted')

			const devices = await navigator.mediaDevices.enumerateDevices()
			const cameras = devices.filter((device) => device.kind === 'videoinput')
			setCameraDevices(cameras)
			logDebug('cameras after permission grant', cameras.length)
			if (!selectedCameraDeviceId && cameras.length > 0) {
				setSelectedCameraDeviceId(cameras[0].deviceId)
			}
		} catch (error) {
			console.error('Error requesting camera permissions:', error)
			logDebug('camera permission request failed', error)
		}
	}

	const handleCameraChange = (event: any) => {
		setSelectedCameraDeviceId(event.target.value)
		logDebug('selected camera changed', event.target.value)
	}

	return (
		<section className={styles.panel}>
			<h3>👁️‍🗨️ <T>Entrance Observer</T></h3>
			<p className={styles.description}>
				<T>
					Entrance Observer allows you to monitor your hive entrance by counting bees entering and exiting.
					It can also stream video to the app for playback. You can even use your phone camera to stream video to the app.
				</T>
			</p>

			{!hasCameraPermission && (
				<Button type="button" onClick={requestPermissions}>
					<T>Allow camera access</T>
				</Button>
			)}

			{hasCameraPermission && (
				<div className={styles.content}>
					<VisualForm className={styles.form}>
						<div className={styles.controlsRow}>
							<label htmlFor="camera-select"><T>Camera</T></label>
							<select id="camera-select" value={selectedCameraDeviceId} onInput={handleCameraChange}>
								{cameraDevices.map((camera) => (
									<option key={camera.deviceId} value={camera.deviceId}>
										{camera.label || `Camera ${camera.deviceId}`}
									</option>
								))}
							</select>
							{!isCaptureStarted ? (
								<Button
									type="button"
									color="green"
									onClick={(e) => {
										e.preventDefault()
										setUploadState('idle')
										setIsCaptureStarted(true)
									}}
								>
									<T>Start stream</T>
								</Button>
							) : (
								<Button
									type="button"
									onClick={(e) => {
										e.preventDefault()
										setIsCaptureStarted(false)
									}}
								>
									<T>Stop stream</T>
								</Button>
							)}
						</div>
					</VisualForm>

					{!canUpload && (
						<div className={styles.warning}>
							<strong><T>Upload disabled</T>:</strong>{' '}
							<T>This device is not linked to a hive entrance section (box). Stream works as local preview only.</T>
						</div>
					)}

					{isCaptureStarted && (
						<div className={styles.status}>
							<div>🟢 <T>Video recording in progress</T></div>
							{!canUpload && <div>🟠 <T>Upload disabled because device is not linked to a box</T></div>}
							{uploadState === 'waiting' && <div>🟡 <T>Waiting for next fragment upload (about 10 seconds)</T></div>}
							{uploadState === 'ok' && <div>🟢 <T>Fragment upload succeeded</T></div>}
							{uploadState === 'fail' && <div>🔴 <T>Fragment upload failed</T></div>}
						</div>
					)}

					{isCaptureStarted && (
						<video
							title="Local video stream preview"
							ref={videoRef}
							className={styles.preview}
							autoPlay
							playsInline
							muted
						/>
					)}
				</div>
			)}
		</section>
	)
}
