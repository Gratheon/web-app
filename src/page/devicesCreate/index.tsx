import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import PagePaddedCentered from '@/shared/pagePaddedCentered'

import styles from './styles.module.less'

const QUERY = gql`
{
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

const ADD_DEVICE_MUTATION = gql`
mutation addDevice($device: DeviceInput!) {
	addDevice(device: $device) {
		id
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

const GENERATE_TOKEN_MUTATION = gql`
mutation generateApiToken {
	generateApiToken {
		token
	}
}
`

type DeviceType = 'IOT_SENSOR' | 'VIDEO_CAMERA'

export default function DevicesCreatePage() {
	const navigate = useNavigate()
	const [form, setForm] = useState({
		name: '',
		type: 'IOT_SENSOR' as DeviceType,
		hiveId: '',
		boxId: '',
	})
	const [creating, setCreating] = useState(false)
	const [creatingMessage, setCreatingMessage] = useState('')

	const [addDevice, { error: addError }] = useMutation(ADD_DEVICE_MUTATION)
	const [updateDevice, { error: updateError }] = useMutation(UPDATE_DEVICE_MUTATION)
	const [generateToken, { error: generateError }] = useMutation(GENERATE_TOKEN_MUTATION)
	const { loading, error, data } = useQuery(QUERY)

	const hiveOptions = useMemo(() => {
		const options: Array<{ id: string; label: string }> = []
		const apiaries = data?.apiaries || []
		apiaries.forEach((apiary: any) => {
			(apiary.hives || []).forEach((hive: any) => {
				const hiveLabel = hive?.hiveNumber ? `Hive #${hive.hiveNumber}` : `Hive ${hive.id}`
				const familyName = hive?.family?.name ? ` (${hive.family.name})` : ''
				options.push({ id: hive.id, label: `${apiary.name || 'Apiary'} - ${hiveLabel}${familyName}` })
			})
		})
		return options
	}, [data?.apiaries])

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

	async function handleCreate(event: React.ChangeEvent) {
		event.preventDefault()
		if (!form.name.trim()) return
		setCreating(true)
		const result = await addDevice({
			device: {
				name: form.name.trim(),
				type: form.type,
				apiToken: null,
				hiveId: form.hiveId || '',
				boxId: form.boxId || '',
			},
		})
		const deviceID = result?.data?.addDevice?.id
		if (!deviceID) {
			setCreating(false)
			return
		}

		setCreatingMessage('Generating API token...')
		const tokenResult = await generateToken()
		const token = tokenResult?.data?.generateApiToken?.token || ''
		if (token) {
			await updateDevice({
				id: deviceID,
				device: {
					apiToken: token,
				},
			})
		}

		setCreating(false)
		navigate(`/devices/${deviceID}`, { replace: true })
	}

	if (loading) return <Loader />

	return (
		<PagePaddedCentered>
			<h1><T>Add device</T></h1>
			{error || addError || updateError || generateError ? <ErrorMsg error={error || addError || updateError || generateError} /> : null}
			<div className={styles.formContainer}>
					<VisualForm
						onSubmit={handleCreate}
						submit={
							<div className={styles.actions}>
								<Button type="button" onClick={() => navigate('/devices', { replace: true })}><T>Cancel</T></Button>
								<Button type="submit" color="green" loading={creating}>
									{creatingMessage || <T>Create</T>}
								</Button>
							</div>
						}
					>
						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Device name</T></label>
							<input
								className={`${styles.flexInput} ${styles.nameInput}`}
								placeholder="Device name"
								value={form.name}
								onInput={(e: any) => setForm({ ...form, name: e.target.value })}
								autoFocus
							/>
						</div>

						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Type</T></label>
							<div className={styles.radioGroup}>
								<label>
									<input
										type="radio"
										value="IOT_SENSOR"
										checked={form.type === 'IOT_SENSOR'}
										onChange={(e: any) => setForm({ ...form, type: e.target.value as DeviceType })}
									/>
									<T>IoT sensor</T>
								</label>
								<label>
									<input
										type="radio"
										value="VIDEO_CAMERA"
										checked={form.type === 'VIDEO_CAMERA'}
										onChange={(e: any) => setForm({ ...form, type: e.target.value as DeviceType })}
									/>
									<T>Video camera</T>
								</label>
							</div>
						</div>

						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Linked hive</T></label>
							<select
								className={styles.flexInput}
								value={form.hiveId}
								onInput={(e: any) => setForm({ ...form, hiveId: e.target.value, boxId: '' })}
							>
								<option value="">No hive linked</option>
								{hiveOptions.map((hive) => (
									<option key={hive.id} value={hive.id}>{hive.label}</option>
								))}
							</select>
						</div>

						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Linked section</T></label>
							<select
								className={styles.flexInput}
								value={form.boxId}
								disabled={!form.hiveId}
								onInput={(e: any) => setForm({ ...form, boxId: e.target.value })}
							>
								<option value="">No specific section</option>
								{(boxOptionsByHive.get(form.hiveId) || []).map((box) => (
									<option key={box.id} value={box.id}>{box.label}</option>
								))}
							</select>
						</div>

					</VisualForm>
			</div>
		</PagePaddedCentered>
	)
}
