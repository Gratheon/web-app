const VIRTUAL_CAMERA_LABEL_PATTERNS = [
	/\bvirtual\b/i,
	/\bobs\b/i,
	/snap camera/i,
	/manycam/i,
	/xsplit/i,
	/\bndi\b/i,
	/camtwist/i,
	/mmhmm/i,
	/youcam/i,
	/droidcam/i,
	/epoccam/i,
	/\bcamo\b/i,
	/ecamm/i,
	/webcamoid/i,
]

function normalizeCameraLabel(label: string) {
	return label
		.trim()
		.toLowerCase()
		.replace(/^default\s*[-:]\s*/, '')
}

function isVirtualCamera(device: MediaDeviceInfo) {
	const label = normalizeCameraLabel(device.label || '')
	if (!label) return false

	return VIRTUAL_CAMERA_LABEL_PATTERNS.some((pattern) => pattern.test(label))
}

function isSelectablePhysicalCamera(device: MediaDeviceInfo) {
	return (
		device.kind === 'videoinput' &&
		Boolean(device.deviceId) &&
		device.deviceId !== 'default' &&
		device.deviceId !== 'communications' &&
		!isVirtualCamera(device)
	)
}

function dedupeCameraDevices(cameras: MediaDeviceInfo[]) {
	const seen = new Set<string>()

	return cameras.filter((camera) => {
		const key =
			camera.deviceId ||
			`${normalizeCameraLabel(camera.label)}-${camera.groupId}`
		if (!key || seen.has(key)) return false

		seen.add(key)
		return true
	})
}

export async function listPhysicalCameraDevices() {
	if (!navigator.mediaDevices?.enumerateDevices) return []

	const devices = await navigator.mediaDevices.enumerateDevices()
	return dedupeCameraDevices(devices.filter(isSelectablePhysicalCamera))
}

export function resolveActiveCameraDeviceId(
	cameras: MediaDeviceInfo[],
	stream: MediaStream,
	requestedCameraDeviceId?: string
) {
	const [track] = stream.getVideoTracks()
	const settingsDeviceId = track?.getSettings?.().deviceId
	if (
		settingsDeviceId &&
		cameras.some((camera) => camera.deviceId === settingsDeviceId)
	) {
		return settingsDeviceId
	}

	if (
		requestedCameraDeviceId &&
		cameras.some((camera) => camera.deviceId === requestedCameraDeviceId)
	) {
		return requestedCameraDeviceId
	}

	const activeLabel = normalizeCameraLabel(track?.label || '')
	if (activeLabel) {
		const activeCamera = cameras.find(
			(camera) => normalizeCameraLabel(camera.label || '') === activeLabel
		)
		if (activeCamera) return activeCamera.deviceId
	}

	return cameras[0]?.deviceId || null
}

export function getVideoConstraints(
	cameraDeviceId?: string
): MediaTrackConstraints {
	const constraints: MediaTrackConstraints = {
		width: { ideal: 1280 },
		height: { ideal: 720 },
	}

	if (cameraDeviceId) {
		constraints.deviceId = { exact: cameraDeviceId }
	} else {
		constraints.facingMode = { ideal: 'environment' }
	}

	return constraints
}
