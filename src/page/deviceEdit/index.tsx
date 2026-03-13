import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import CopyButton from '@/shared/copyButton'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import MaskedToken from '@/shared/maskedToken'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'

import styles from './styles.module.less'

const DEVICE_EDIT_QUERY = gql`
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

const GENERATE_TOKEN_MUTATION = gql`
mutation generateApiToken {
	generateApiToken {
		token
	}
}
`

const REVOKE_API_TOKEN_MUTATION = gql`
mutation revokeApiToken($token: String!) {
	revokeApiToken(token: $token) {
		error
	}
}
`

type DeviceType = 'IOT_SENSOR' | 'VIDEO_CAMERA'

export default function DeviceEditPage() {
	const { id } = useParams()
	const navigate = useNavigate()

	const [form, setForm] = useState({
		name: '',
		type: 'IOT_SENSOR' as DeviceType,
		hiveId: '',
		boxId: '',
		apiToken: '',
	})
	const [saving, setSaving] = useState(false)
	const [regeneratingToken, setRegeneratingToken] = useState(false)
	const [initializedDeviceId, setInitializedDeviceId] = useState<string | null>(null)

	const { loading, error, data } = useQuery(DEVICE_EDIT_QUERY)
	const [updateDevice, { error: updateError }] = useMutation(UPDATE_DEVICE_MUTATION)
	const [generateToken, { error: generateError }] = useMutation(GENERATE_TOKEN_MUTATION)
	const [revokeApiToken, { error: revokeError }] = useMutation(REVOKE_API_TOKEN_MUTATION)

	const device = useMemo(() => {
		const devices = data?.devices || []
		return devices.find((item: any) => `${item.id}` === `${id}`)
	}, [data?.devices, id])

	useEffect(() => {
		if (!device) return
		if (`${initializedDeviceId}` === `${device.id}`) return
		setForm({
			name: device.name || '',
			type: device.type || 'IOT_SENSOR',
			hiveId: device.hiveId || '',
			boxId: device.boxId || '',
			apiToken: device.apiToken || '',
		})
		setInitializedDeviceId(`${device.id}`)
	}, [device, initializedDeviceId])

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

	async function handleSave(event: React.FormEvent) {
		event.preventDefault()
		if (!device || !form.name.trim()) return
		setSaving(true)
		try {
			await updateDevice({
				id: device.id,
				device: {
					name: form.name.trim(),
					type: form.type,
					hiveId: form.hiveId || '',
					boxId: form.boxId || '',
					apiToken: form.apiToken.trim() || null,
				},
			})
			navigate(`/devices/${device.id}`, { replace: true })
		} finally {
			setSaving(false)
		}
	}

	async function handleRegenerateToken() {
		if (!device) return
		if (!window.confirm('Regenerate token? This will revoke the old token immediately.')) return

		setRegeneratingToken(true)
		try {
			const previousToken = form.apiToken.trim()
			if (previousToken) {
				await revokeApiToken({ token: previousToken })
			}

			const tokenResult = await generateToken()
			const nextToken = tokenResult?.data?.generateApiToken?.token || ''
			await updateDevice({
				id: device.id,
				device: {
					apiToken: nextToken || null,
				},
			})
			setForm((prev) => ({ ...prev, apiToken: nextToken }))
		} finally {
			setRegeneratingToken(false)
		}
	}

	if (loading) return <Loader />
	if (!device) return <PagePaddedCentered><p><T>Device not found</T></p></PagePaddedCentered>

	return (
		<PagePaddedCentered className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1><T>Manage device</T></h1>
					<p className={styles.subtitle}>{device.name}</p>
				</div>
				<div className={styles.headerActions}>
					<Button href={`/devices/${device.id}`}><T>View</T></Button>
					<Button href="/devices"><T>Back to devices</T></Button>
				</div>
			</div>

			<ErrorMsg error={error || updateError || generateError || revokeError} />

			<div className={styles.card}>
				<VisualForm
					onSubmit={handleSave}
					className={styles.form}
					submit={
						<div className={styles.actions}>
							<Button type="button" onClick={() => navigate('/devices', { replace: true })}><T>Cancel</T></Button>
							<Button type="submit" color="green" loading={saving}><T>Save changes</T></Button>
						</div>
					}
				>
					<div className={styles.formRow}>
						<label className={styles.label}><T>Device name</T></label>
						<input
							className={styles.input}
							value={form.name}
							autoFocus
							onInput={(e: any) => setForm((prev) => ({ ...prev, name: e.target.value }))}
						/>
					</div>

					<div className={styles.formRow}>
						<label className={styles.label}><T>Type</T></label>
						<select
							className={styles.input}
							value={form.type}
							onInput={(e: any) => setForm((prev) => ({ ...prev, type: e.target.value as DeviceType }))}
						>
							<option value="IOT_SENSOR">IoT sensor</option>
							<option value="VIDEO_CAMERA">Video camera</option>
						</select>
					</div>

					<div className={styles.formRow}>
						<label className={styles.label}><T>Linked hive</T></label>
						<select
							className={styles.input}
							value={form.hiveId}
							onInput={(e: any) => setForm((prev) => ({ ...prev, hiveId: e.target.value, boxId: '' }))}
						>
							<option value="">No hive linked</option>
							{hiveOptions.map((hive) => (
								<option key={hive.id} value={hive.id}>{hive.label}</option>
							))}
						</select>
					</div>

					<div className={styles.formRow}>
						<label className={styles.label}><T>Linked section</T></label>
						<select
							className={styles.input}
							value={form.boxId}
							disabled={!form.hiveId}
							onInput={(e: any) => setForm((prev) => ({ ...prev, boxId: e.target.value }))}
						>
							<option value="">No specific section</option>
							{(boxOptionsByHive.get(form.hiveId) || []).map((box) => (
								<option key={box.id} value={box.id}>{box.label}</option>
							))}
						</select>
					</div>

					<div className={styles.formRow}>
						<label className={styles.label}><T>API token</T></label>
						<div className={styles.tokenColumn}>
							{form.apiToken ? (
								<div className={styles.tokenValue}>
									<MaskedToken token={form.apiToken} />
									<CopyButton data={form.apiToken} />
								</div>
							) : (
								<div className={styles.emptyToken}><T>No token assigned</T></div>
							)}
							<div>
								<Button type="button" loading={regeneratingToken} onClick={handleRegenerateToken}>
									<T>Regenerate token</T>
								</Button>
							</div>
						</div>
					</div>
				</VisualForm>
			</div>
		</PagePaddedCentered>
	)
}
