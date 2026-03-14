import React, { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import DevicesPlaceholder from '@/shared/devicesPlaceholder'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { getUser } from '@/models/user'
import { isBillingTierLessThan } from '@/shared/billingTier'

import styles from './style.module.less'

const DEVICES_QUERY = gql`
{
	devices {
		id
		name
		type
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

const DEACTIVATE_DEVICE_MUTATION = gql`
mutation deactivateDevice($id: ID!) {
	deactivateDevice(id: $id)
}
`

type DeviceType = 'IOT_SENSOR' | 'VIDEO_CAMERA'

const PROFESSIONAL_PREVIEW_DEVICES = [
	{
		id: 'preview-video-camera',
		name: 'Video Camera',
		type: 'VIDEO_CAMERA' as DeviceType,
		hiveId: null,
		boxId: null,
	},
	{
		id: 'preview-iot-sensors',
		name: 'IoT Sensors',
		type: 'IOT_SENSOR' as DeviceType,
		hiveId: null,
		boxId: null,
	},
]

function formatDeviceType(type: DeviceType) {
	return type === 'VIDEO_CAMERA' ? 'Video camera' : 'IoT sensor'
}

export default function DevicesPage() {
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const user = useLiveQuery(() => getUser(), [], null)
	const isDevicesLocked = isBillingTierLessThan(user?.billingPlan, 'professional')

	const [deactivateDevice, { error: deactivateError }] = useMutation(DEACTIVATE_DEVICE_MUTATION)
	const { loading, error, data, reexecuteQuery } = useQuery(DEVICES_QUERY)

	const devices = useMemo(() => data?.devices || [], [data?.devices])
	const displayedDevices = useMemo(
		() => (isDevicesLocked ? PROFESSIONAL_PREVIEW_DEVICES : devices),
		[isDevicesLocked, devices]
	)
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

	async function handleDelete(id: string) {
		if (isDevicesLocked) return

		if (!window.confirm('Delete this device?')) return
		setDeletingId(id)
		await deactivateDevice({ id })
		setDeletingId(null)
		reexecuteQuery()
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

			<ErrorMsg error={error || deactivateError} />

			<section className={styles.section}>
				{displayedDevices.length === 0 && <DevicesPlaceholder />}

				{displayedDevices.length > 0 && (
					<div className={styles.list}>
						{displayedDevices.map((device: any) => {
							const hiveLabel = device.hiveId ? (hiveOptionById.get(device.hiveId) || `Hive ${device.hiveId}`) : '—'
							const boxLabel = device.boxId ? (boxOptionById.get(device.boxId) || `Section ${device.boxId}`) : '—'
							return (
								<div key={device.id} className={styles.row}>
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
										<Button size="small" href={`/devices/${device.id}/edit`}><T>Edit</T></Button>
										<Button size="small" color="red" loading={deletingId === device.id} onClick={() => handleDelete(device.id)}><T>Delete</T></Button>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</section>
		</div>
	)
}
