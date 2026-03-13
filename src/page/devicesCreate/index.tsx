import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import Card from '@/shared/pagePaddedCentered/card'

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

const GENERATE_TOKEN_MUTATION = gql`
mutation generateApiToken {
	generateApiToken {
		token
	}
}
`

type DeviceType = 'IOT_SENSOR' | 'VIDEO_CAMERA'

const IOT_DOCS_URL = 'https://gratheon.com/docs/beehive-sensors/'
const IOT_REPO_URL = 'https://github.com/Gratheon/beehive-sensors/'
const VIDEO_DOCS_URL = 'https://gratheon.com/docs/entrance-observer/'
const VIDEO_PRODUCT_URL = 'https://gratheon.com/about/products/entrance_observer/'
const VIDEO_REPO_URL = 'https://github.com/Gratheon/entrance-observer/'

function getTypeLinks(type: DeviceType) {
	if (type === 'VIDEO_CAMERA') {
		return [
			{ href: VIDEO_DOCS_URL, label: 'Entrance Observer docs' },
			{ href: VIDEO_PRODUCT_URL, label: 'Entrance Observer product page' },
			{ href: VIDEO_REPO_URL, label: 'Entrance Observer code' },
		]
	}

	return [
		{ href: IOT_DOCS_URL, label: 'IoT sensor docs' },
		{ href: IOT_REPO_URL, label: 'Beehive sensors code' },
	]
}

export default function DevicesCreatePage() {
	const navigate = useNavigate()
	const [form, setForm] = useState({
		name: '',
		type: 'IOT_SENSOR' as DeviceType,
		apiToken: '',
		hiveId: '',
		boxId: '',
	})
	const [creating, setCreating] = useState(false)
	const [generating, setGenerating] = useState(false)

	const [addDevice, { error: addError }] = useMutation(ADD_DEVICE_MUTATION)
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
				apiToken: form.apiToken.trim() ? form.apiToken.trim() : null,
				hiveId: form.hiveId || '',
				boxId: form.boxId || '',
			},
		})
		setCreating(false)
		if (result?.data?.addDevice?.id) {
			navigate('/devices', { replace: true })
		}
	}

	async function handleGenerateToken() {
		setGenerating(true)
		const result = await generateToken()
		setGenerating(false)
		const token = result?.data?.generateApiToken?.token || ''
		if (!token) return
		setForm((prev) => ({ ...prev, apiToken: token }))
	}

	if (loading) return <Loader />

	return (
		<PagePaddedCentered>
			<h1><T>Add device</T></h1>
			{error || addError || generateError ? <ErrorMsg error={error || addError || generateError} /> : null}
			<Card>
				<div style={{ padding: 20 }}>
					<VisualForm
						onSubmit={handleCreate}
						submit={
							<div className={styles.actions}>
								<Button type="button" onClick={() => navigate('/devices', { replace: true })}><T>Cancel</T></Button>
								<Button type="submit" color="green" loading={creating}><T>Create</T></Button>
							</div>
						}
					>
						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Device name</T></label>
							<input
								className={styles.flexInput}
								placeholder="Device name"
								value={form.name}
								onInput={(e: any) => setForm({ ...form, name: e.target.value })}
								autoFocus
							/>
						</div>

						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Type</T></label>
							<select
								className={styles.flexInput}
								value={form.type}
								onInput={(e: any) => setForm({ ...form, type: e.target.value as DeviceType })}
							>
								<option value="IOT_SENSOR">IoT sensor</option>
								<option value="VIDEO_CAMERA">Video camera</option>
							</select>
						</div>

						<div className={styles.formField}>
							<label className={styles.formLabel}><T>API token</T></label>
							<div className={styles.flexRow}>
								<input
									className={styles.flexInput}
									placeholder="API token"
									value={form.apiToken}
									onInput={(e: any) => setForm({ ...form, apiToken: e.target.value })}
								/>
								<Button type="button" size="small" loading={generating} onClick={handleGenerateToken}>
									<T>Generate token</T>
								</Button>
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

						<div className={styles.formField}>
							<label className={styles.formLabel}><T>Setup docs</T></label>
							<div className={styles.typeLinks}>
								{getTypeLinks(form.type).map((link) => (
									<a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
								))}
							</div>
						</div>
					</VisualForm>
				</div>
			</Card>
		</PagePaddedCentered>
	)
}
