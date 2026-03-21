import React, { useMemo } from 'react'
import { useParams } from 'react-router'

import { gql, useQuery } from '@/api'
import Button from '@/shared/button'
import CopyButton from '@/shared/copyButton'
import DeviceVideoStream from '@/shared/deviceVideoStream'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import MaskedToken from '@/shared/maskedToken'
import T from '@/shared/translate'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import StreamPlayer from '@/page/hiveEdit/gateBox/streamPlayer'

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
				roofStyle
			}
		}
	}
}
`

const DEVICE_STREAMS_QUERY = gql`
query deviceStreams($boxIds: [ID]!) {
	videoStreams(boxIds: $boxIds) {
		id
		maxSegment
		playlistURL
		startTime
		endTime
		active
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
	const streamBoxIds = useMemo(
		() => (device?.type === 'VIDEO_CAMERA' && device?.boxId ? [+device.boxId] : []),
		[device?.type, device?.boxId]
	)
	const { data: streamsData } = useQuery(DEVICE_STREAMS_QUERY, { variables: { boxIds: streamBoxIds } })
	const videoStreams = streamsData?.videoStreams || []

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
				<div className={styles.headerActions}>
					<Button href={`/devices/${device.id}/edit`}>
						<T>Manage</T>
					</Button>
					{device.boxId && hiveContext ? (
						<Button color="green" href={`/apiaries/${hiveContext.apiaryId}/hives/${hiveContext.hiveId}/box/${device.boxId}`}>
							<T>Open linked section</T>{hiveContext.box ? ` (#${hiveContext.box.position + 1})` : ''}
						</Button>
					) : null}
				</div>
			</div>

			<section className={styles.section}>
				<h3><T>API token</T></h3>
				{device.apiToken ? (
					<div className={styles.tokenRow}>
						<MaskedToken token={device.apiToken} />
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

			{device.type === 'VIDEO_CAMERA' && (
				<section className={styles.section}>
					<DeviceVideoStream boxId={device.boxId || null} />
					{videoStreams.length > 0 && (
						<div style={{ marginTop: 20 }}>
							<h3><T>Past stream playback</T></h3>
							<StreamPlayer videoStreams={videoStreams} />
						</div>
					)}
				</section>
			)}
		</PagePaddedCentered>
	)
}
