import { useEffect, useMemo, useState } from 'react';
import { gql, useQuery } from '../../../api';
import { useMutation } from '../../../api';
import Button from '@/shared/button';
import T from '@/shared/translate';
import VisualForm from '@/shared/visualForm';
import styles from './styles.module.less';

const UPDATE_DEVICE_MUTATION = gql`
mutation updateDevice($id: ID!, $device: DeviceUpdateInput!) {
	updateDevice(id: $id, device: $device) {
		id
	}
}
`

export default function GateBox({ boxId, hiveId }) {
	let {
		loading, data,
	} = useQuery(gql`
	query boxStreams($boxIds: [ID]!) {
		devices {
			id
			name
			type
			hiveId
			boxId
		}
	}
`, { variables: { boxIds: [+boxId] } });
	const [updateDevice, { error: updateError }] = useMutation(UPDATE_DEVICE_MUTATION)
	const [selectedDeviceId, setSelectedDeviceId] = useState('')
	const [isSavingConnection, setIsSavingConnection] = useState(false)
	const [connectionMessage, setConnectionMessage] = useState('')

	const videoDevices = useMemo(
		() => (data?.devices || []).filter((device) => device.type === 'VIDEO_CAMERA'),
		[data?.devices]
	)
	const connectedDevice = useMemo(
		() => videoDevices.find((device) => `${device.boxId}` === `${boxId}`),
		[boxId, videoDevices]
	)

	useEffect(() => {
		setSelectedDeviceId(connectedDevice?.id || '')
	}, [connectedDevice?.id])

	if (loading) {
		return null;
	}

	const handleConnect = async (event) => {
		event.preventDefault()
		setConnectionMessage('')
		if (isSavingConnection) return

		setIsSavingConnection(true)
		try {
			const previousId = connectedDevice?.id || ''
			const nextId = selectedDeviceId || ''

			if (previousId && previousId !== nextId) {
				await updateDevice({
					id: previousId,
					device: {
						hiveId: '',
						boxId: '',
					},
				})
			}

			if (nextId) {
				await updateDevice({
					id: nextId,
					device: {
						hiveId: `${hiveId}`,
						boxId: `${boxId}`,
					},
				})
				setConnectionMessage('Device connected to this entrance.')
			} else {
				setConnectionMessage('Entrance device was disconnected.')
			}
		} finally {
			setIsSavingConnection(false)
		}
	}

	const streamStart = (
		<div className={styles.gateCameraWrap}>
			<h3>👁️‍🗨️ <T>Entrance Observer</T></h3>
			<p>
				<T>
					Select which video camera device should be connected to this hive entrance.
					Camera permissions and local streaming are managed from the device page.
				</T>
			</p>
			<VisualForm className={styles.connectionForm} onSubmit={handleConnect}>
				<div className={styles.connectionRow}>
					<label htmlFor={`entrance-device-select-${boxId}`}><T>Connected device</T></label>
					<select
						id={`entrance-device-select-${boxId}`}
						value={selectedDeviceId}
						onInput={(event: any) => setSelectedDeviceId(event.target.value)}
					>
						<option value=""><T>No device connected</T></option>
						{videoDevices.map((device) => (
							<option key={device.id} value={device.id}>
								{device.name}
							</option>
						))}
					</select>
					<Button type="submit" color="green" loading={isSavingConnection}>
						<T>Save connection</T>
					</Button>
				</div>
			</VisualForm>
			{updateError ? <div className={styles.connectionError}>{updateError.message}</div> : null}
			{connectionMessage ? <div className={styles.connectionHint}>{connectionMessage}</div> : null}
		</div>
	);

	return <div>
		{streamStart}
	</div>;
}
