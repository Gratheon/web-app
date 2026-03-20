import { useEffect, useMemo, useState } from 'react';
import { gql, useQuery } from '../../../api';
import { useMutation } from '../../../api';
import Button from '@/shared/button';
import T from '@/shared/translate';
import VisualForm from '@/shared/visualForm';
import Slider from '@/shared/slider';
import { useLiveQuery } from 'dexie-react-hooks';
import {
	getBox,
	updateBox,
	GATE_HOLE_COUNT_MIN,
	GATE_HOLE_COUNT_MAX,
	normalizeGateHoleCount,
} from '@/models/boxes';
import styles from './styles.module.less';

const UPDATE_DEVICE_MUTATION = gql`
mutation updateDevice($id: ID!, $device: DeviceUpdateInput!) {
	updateDevice(id: $id, device: $device) {
		id
	}
}
`

const UPDATE_BOX_HOLE_COUNT_MUTATION = gql`
mutation updateBoxHoleCount($id: ID!, $holeCount: Int!) {
	updateBoxHoleCount(id: $id, holeCount: $holeCount)
}
`

export default function GateBox({ boxId, hiveId }) {
	const gateBox = useLiveQuery(
		() => getBox(+boxId),
		[boxId],
		null
	)
	const [isSavingHoleCount, setIsSavingHoleCount] = useState(false)
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
	const [updateBoxHoleCountMutation, { error: updateHoleCountError }] = useMutation(UPDATE_BOX_HOLE_COUNT_MUTATION)
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

	const holeCount = normalizeGateHoleCount(gateBox?.holeCount)

	const onHoleCountChange = async (event: any) => {
		if (!gateBox?.id || isSavingHoleCount) return
		const nextCount = normalizeGateHoleCount(event?.target?.value)
		if (nextCount === holeCount) return

		setIsSavingHoleCount(true)
		setConnectionMessage('')
		try {
			const holeCountResult = await updateBoxHoleCountMutation({
				id: `${gateBox.id}`,
				holeCount: nextCount,
			})
			if (holeCountResult?.error) {
				throw holeCountResult.error
			}
			await updateBox({
				id: +gateBox.id,
				hiveId: gateBox.hiveId ? +gateBox.hiveId : +hiveId,
				position: +gateBox.position,
				type: gateBox.type,
				color: gateBox.color,
				holeCount: nextCount,
			})
			setConnectionMessage('Entrance hole count saved.')
		} catch (error) {
			setConnectionMessage('Failed to save entrance hole count.')
		} finally {
			setIsSavingHoleCount(false)
		}
	}

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
			{updateHoleCountError ? <div className={styles.connectionError}>{updateHoleCountError.message}</div> : null}
			{connectionMessage ? <div className={styles.connectionHint}>{connectionMessage}</div> : null}

			<div className={styles.holeControl}>
				<h4><T>Entrance hole count</T></h4>
				<p className={styles.holeHint}>
					<T>
						Adjust how many entrance holes are open right now.
					</T>
				</p>
				<div className={styles.sliderRow}>
					<Slider
						backgroundColor="#2f80ed"
						value={holeCount}
						min={GATE_HOLE_COUNT_MIN}
						max={GATE_HOLE_COUNT_MAX}
						width={240}
						onChange={onHoleCountChange}
					/>
					<div className={styles.holeValue}>{holeCount}</div>
				</div>
				{isSavingHoleCount && <div className={styles.connectionHint}><T>Saving entrance holes...</T></div>}
			</div>
		</div>
	);

	return <div>
		{streamStart}
	</div>;
}
