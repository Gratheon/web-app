import React, { useMemo } from 'react'
import { useParams } from 'react-router'

import { gql, useQuery } from '@/api'
import Button from '@/shared/button'
import CopyButton from '@/shared/copyButton'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import PagePaddedCentered from '@/shared/pagePaddedCentered'

import styles from './styles.module.less'

const DEVICE_QUERY = gql`
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
		hives {
			id
			hiveNumber
			boxes {
				id
				position
			}
		}
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

export default function DeviceViewPage() {
	const { id } = useParams()
	const { loading, error, data } = useQuery(DEVICE_QUERY)

	const device = useMemo(() => {
		const devices = data?.devices || []
		return devices.find((item: any) => `${item.id}` === `${id}`)
	}, [data?.devices, id])
	const hiveContext = useMemo(() => {
		if (!device?.hiveId) return null
		const apiaries = data?.apiaries || []
		for (const apiary of apiaries) {
			for (const hive of apiary.hives || []) {
				if (`${hive.id}` === `${device.hiveId}`) {
					const box = (hive.boxes || []).find((b: any) => `${b.id}` === `${device.boxId}`)
					return {
						apiaryId: apiary.id,
						hiveId: hive.id,
						hiveNumber: hive.hiveNumber,
						box,
					}
				}
			}
		}
		return null
	}, [data?.apiaries, device?.hiveId, device?.boxId])

	if (loading) return <Loader />
	if (error) return <ErrorMsg error={error} />
	if (!device) return <PagePaddedCentered><p><T>Device not found</T></p></PagePaddedCentered>

	return (
		<PagePaddedCentered>
			<div className={styles.header}>
				<div>
					<h1>{device.name}</h1>
					<div className={styles.meta}>{device.type === 'VIDEO_CAMERA' ? 'Video camera' : 'IoT sensor'}</div>
				</div>
			</div>

			<section className={styles.section}>
				<h3><T>API token</T></h3>
				{device.apiToken ? (
					<div className={styles.tokenRow}>
						<div className={styles.token}>{device.apiToken}</div>
						<CopyButton data={device.apiToken} />
					</div>
				) : (
					<p><T>Token was not generated.</T></p>
				)}
			</section>

			<section className={styles.section}>
				<h3><T>Setup docs</T></h3>
				<div className={styles.links}>
					{getTypeLinks(device.type).map((link) => (
						<a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
					))}
				</div>
			</section>

			{device.hiveId && (
				<section className={styles.section}>
					<h3><T>Linked locations</T></h3>
					<div className={styles.links}>
						{hiveContext ? (
							<Button size="small" href={`/apiaries/${hiveContext.apiaryId}/hives/${hiveContext.hiveId}`}>
								<T>Open linked hive</T>{hiveContext.hiveNumber ? ` (Hive #${hiveContext.hiveNumber})` : ''}
							</Button>
						) : (
							<span><T>Linked hive</T>: {device.hiveId}</span>
						)}

						{device.boxId && hiveContext ? (
							<Button size="small" href={`/apiaries/${hiveContext.apiaryId}/hives/${hiveContext.hiveId}/box/${device.boxId}`}>
								<T>Open linked section</T>{hiveContext.box ? ` (#${hiveContext.box.position + 1})` : ''}
							</Button>
						) : null}
					</div>
				</section>
			)}
		</PagePaddedCentered>
	)
}
