import React, { useMemo, useState } from 'react'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import DevicesPlaceholder from '@/shared/devicesPlaceholder'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'

import styles from './style.module.less'

const DEVICES_QUERY = gql`
{
	devices {
		id
		name
		type
		apiToken
		hiveId
		boxId
	}
	apiaries {
		id
		name
		hives {
			id
			hiveNumber
			family {
				name
			}
			boxes {
				id
				position
				type
			}
		}
	}
}
`

const UPDATE_DEVICE_MUTATION = gql`
mutation updateDevice($id: ID!, $device: DeviceUpdateInput!) {
	updateDevice(id: $id, device: $device) {
		id
	}
}
`

const DEACTIVATE_DEVICE_MUTATION = gql`
mutation deactivateDevice($id: ID!) {
	deactivateDevice(id: $id)
}
`

const GENERATE_TOKEN_MUTATION = gql`
mutation generateApiToken {
	generateApiToken {
		token
	}
}
`

type DeviceType = 'IOT_SENSOR' | 'VIDEO_CAMERA'

function formatDeviceType(type: DeviceType) {
	return type === 'VIDEO_CAMERA' ? 'Video camera' : 'IoT sensor'
}

export default function DevicesPage() {
	const [editingId, setEditingId] = useState<string | null>(null)
	const [updating, setUpdating] = useState(false)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [generatingEditToken, setGeneratingEditToken] = useState(false)
	const [editingForm, setEditingForm] = useState({
		name: '',
		type: 'IOT_SENSOR' as DeviceType,
		apiToken: '',
		hiveId: '',
		boxId: '',
	})

	const [updateDevice, { error: updateError }] = useMutation(UPDATE_DEVICE_MUTATION)
	const [deactivateDevice, { error: deactivateError }] = useMutation(DEACTIVATE_DEVICE_MUTATION)
	const [generateToken, { error: generateError }] = useMutation(GENERATE_TOKEN_MUTATION)
	const { loading, error, data, reexecuteQuery } = useQuery(DEVICES_QUERY)

	const devices = useMemo(() => data?.devices || [], [data?.devices])
	const hiveOptions = useMemo(() => {
		const options: Array<{ id: string; label: string }> = []
		const apiaries = data?.apiaries || []
		apiaries.forEach((apiary: any) => {
			(apiary.hives || []).forEach((hive: any) => {
				const hiveLabel = hive?.hiveNumber ? `Hive #${hive.hiveNumber}` : `Hive ${hive.id}`
				const familyName = hive?.family?.name ? ` (${hive.family.name})` : ''
				options.push({
					id: hive.id,
					label: `${apiary.name || 'Apiary'} - ${hiveLabel}${familyName}`,
				})
			})
		})
		return options
	}, [data?.apiaries])
	const hiveOptionById = useMemo(() => new Map(hiveOptions.map((hive) => [hive.id, hive.label])), [hiveOptions])
	const boxOptionsByHive = useMemo(() => {
		const result = new Map<string, Array<{ id: string; label: string }>>()
		const apiaries = data?.apiaries || []
		apiaries.forEach((apiary: any) => {
			(apiary.hives || []).forEach((hive: any) => {
				const hiveLabel = hive?.hiveNumber ? `Hive #${hive.hiveNumber}` : `Hive ${hive.id}`
				result.set(
					hive.id,
					(hive.boxes || []).map((box: any) => ({
						id: box.id,
						label: `${apiary.name || 'Apiary'} - ${hiveLabel} - Section ${box.position + 1} (${box.type})`,
					}))
				)
			})
		})
		return result
	}, [data?.apiaries])
	const boxOptionById = useMemo(() => {
		const result = new Map<string, string>()
		for (const options of boxOptionsByHive.values()) {
			options.forEach((box) => result.set(box.id, box.label))
		}
		return result
	}, [boxOptionsByHive])

	function startEdit(device: any) {
		setEditingId(device.id)
		setEditingForm({
			name: device.name || '',
			type: device.type || 'IOT_SENSOR',
			apiToken: device.apiToken || '',
			hiveId: device.hiveId || '',
			boxId: device.boxId || '',
		})
	}

	async function handleUpdate() {
		if (!editingId || !editingForm.name.trim()) {
			return
		}

		setUpdating(true)
		await updateDevice({
			id: editingId,
			device: {
				name: editingForm.name.trim(),
				type: editingForm.type,
				apiToken: editingForm.apiToken.trim() ? editingForm.apiToken.trim() : null,
				hiveId: editingForm.hiveId || '',
				boxId: editingForm.boxId || '',
			},
		})
		setUpdating(false)
		setEditingId(null)
		reexecuteQuery()
	}

	async function handleDelete(id: string) {
		if (!window.confirm('Delete this device?')) return
		setDeletingId(id)
		await deactivateDevice({ id })
		setDeletingId(null)
		if (editingId === id) setEditingId(null)
		reexecuteQuery()
	}

	async function handleGenerateEditToken() {
		setGeneratingEditToken(true)
		const result = await generateToken()
		setGeneratingEditToken(false)
		const token = result?.data?.generateApiToken?.token || ''
		if (!token) return
		setEditingForm((prev) => ({ ...prev, apiToken: token }))
	}

	if (loading) return <Loader />

	return (
		<div className={styles.page}>
			<div className={styles.topBar}>
				<div>
					<h2><T>Devices</T></h2>
					<p className={styles.description}>
						<T>Add devices that send hive information, such as scales, temperature sensors, audio trackers, and video trackers.</T>
					</p>
				</div>
				<div className={styles.topBarAction}>
					<Button color="green" href="/devices/add"><T>Add device</T></Button>
				</div>
			</div>

			<ErrorMsg error={error || updateError || deactivateError || generateError} />

			<section className={styles.section}>
				<h3><T>Device list</T></h3>

				{devices.length === 0 && <DevicesPlaceholder />}

				{devices.length > 0 && (
					<div className={styles.list}>
						{devices.map((device: any) => {
							const isEditing = editingId === device.id
							const hiveLabel = device.hiveId ? (hiveOptionById.get(device.hiveId) || `Hive ${device.hiveId}`) : '—'
							const boxLabel = device.boxId ? (boxOptionById.get(device.boxId) || `Section ${device.boxId}`) : '—'
							return (
								<div key={device.id} className={styles.row}>
									{!isEditing && (
										<>
											<div className={styles.deviceInfo}>
												<div>
													<a className={styles.deviceNameLink} href={`/devices/${device.id}`}>
														<strong>{device.name}</strong>
													</a>
												</div>
												<div className={styles.meta}>{formatDeviceType(device.type)}</div>
											</div>
											<div className={styles.dataColumn}>
												<div className={styles.columnTitle}><T>Hive</T></div>
												<div className={styles.columnValue}>{hiveLabel}</div>
											</div>
											<div className={styles.dataColumn}>
												<div className={styles.columnTitle}><T>Section</T></div>
												<div className={styles.columnValue}>{boxLabel}</div>
											</div>
											<div className={styles.buttons}>
												<Button size="small" onClick={() => startEdit(device)}><T>Edit</T></Button>
												<Button size="small" color="red" loading={deletingId === device.id} onClick={() => handleDelete(device.id)}><T>Delete</T></Button>
											</div>
										</>
									)}

									{isEditing && (
										<>
											<input className={styles.input} value={editingForm.name} onInput={(e: any) => setEditingForm({ ...editingForm, name: e.target.value })} />
											<select className={styles.select} value={editingForm.type} onInput={(e: any) => setEditingForm({ ...editingForm, type: e.target.value as DeviceType })}>
												<option value="IOT_SENSOR">IoT sensor</option>
												<option value="VIDEO_CAMERA">Video camera</option>
											</select>
											<input className={styles.input} value={editingForm.apiToken} placeholder="API token" onInput={(e: any) => setEditingForm({ ...editingForm, apiToken: e.target.value })} />
											<select className={styles.select} value={editingForm.hiveId} onInput={(e: any) => setEditingForm({ ...editingForm, hiveId: e.target.value, boxId: '' })}>
												<option value="">No hive linked</option>
												{hiveOptions.map((hive) => <option key={hive.id} value={hive.id}>{hive.label}</option>)}
											</select>
											<select className={styles.select} value={editingForm.boxId} disabled={!editingForm.hiveId} onInput={(e: any) => setEditingForm({ ...editingForm, boxId: e.target.value })}>
												<option value="">No specific section</option>
												{(boxOptionsByHive.get(editingForm.hiveId) || []).map((box) => <option key={box.id} value={box.id}>{box.label}</option>)}
											</select>
											<div className={styles.buttons}>
												<Button size="small" loading={generatingEditToken} onClick={handleGenerateEditToken}><T>Generate token</T></Button>
												<Button size="small" color="green" loading={updating} onClick={handleUpdate}><T>Save</T></Button>
												<Button size="small" onClick={() => setEditingId(null)}><T>Cancel</T></Button>
											</div>
										</>
									)}
								</div>
							)
						})}
					</div>
				)}
			</section>
		</div>
	)
}
