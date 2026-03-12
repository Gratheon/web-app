import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'

import { getApiary } from '@/models/apiary'
import { getHive } from '@/models/hive'
import Loader from '@/shared/loader'
import MessageNotFound from '@/shared/messageNotFound'
import T from '@/shared/translate'

import HiveAdvisor from '@/page/hiveEdit/hiveAdvisor'
import beekeeperURL from '@/assets/beekeeper.png'
import styles from './index.module.less'

const ADVISOR_CONTEXT_KEY = 'ai-advisor-last-hive-context'

function getStoredContext() {
	try {
		const rawValue = localStorage.getItem(ADVISOR_CONTEXT_KEY)
		if (!rawValue) return null
		const parsed = JSON.parse(rawValue)
		if (!parsed?.apiaryId || !parsed?.hiveId) return null
		return {
			apiaryId: +parsed.apiaryId,
			hiveId: +parsed.hiveId,
		}
	} catch {
		return null
	}
}

export default function AIAdvisorPage() {
	const [searchParams] = useSearchParams()

	const context = useMemo(() => {
		const apiaryIdParam = +searchParams.get('apiaryId')
		const hiveIdParam = +searchParams.get('hiveId')

		if (Number.isFinite(apiaryIdParam) && apiaryIdParam > 0 && Number.isFinite(hiveIdParam) && hiveIdParam > 0) {
			return {
				apiaryId: apiaryIdParam,
				hiveId: hiveIdParam,
			}
		}

		return getStoredContext()
	}, [searchParams])

	useEffect(() => {
		if (!context) return
		localStorage.setItem(ADVISOR_CONTEXT_KEY, JSON.stringify(context))
	}, [context])

	const apiary = useLiveQuery(
		() => (context ? getApiary(context.apiaryId) : undefined),
		[context?.apiaryId],
		null
	)
	const hive = useLiveQuery(
		() => (context ? getHive(context.hiveId) : undefined),
		[context?.hiveId],
		null
	)

	if (!context) {
		return (
			<div className={styles.pageWrap}>
				<div className={styles.header}>
					<img className={styles.heroImage} src={beekeeperURL} alt="AI Advisor" />
					<p className={styles.subtitle}>
						<T>Context-aware help for your beekeeping workflow.</T>
					</p>
				</div>
				<MessageNotFound msg={<T>No hive selected</T>}>
					<div className={styles.empty}>
						<p>
							<T>
								AI Advisor uses the currently opened hive context to assess colony state and suggest next steps.
							</T>
						</p>
						<p>
							<T>Open a specific hive first, then click the AI Advisor menu item.</T>
						</p>
					</div>
				</MessageNotFound>
			</div>
		)
	}

	if (apiary === null || hive === null) {
		return <Loader />
	}

	if (!apiary || !hive) {
		return (
			<div className={styles.pageWrap}>
				<div className={styles.header}>
					<img className={styles.heroImage} src={beekeeperURL} alt="AI Advisor" />
				</div>
				<MessageNotFound msg={<T>Hive not found</T>}>
					<div className={styles.empty}>
						<T>The selected hive context is no longer available.</T>
					</div>
				</MessageNotFound>
			</div>
		)
	}

	return (
		<div className={styles.pageWrap}>
			<div className={styles.header}>
				<img className={styles.heroImage} src={beekeeperURL} alt="AI Advisor" />
				<p className={styles.subtitle}>
					<T>
						AI Advisor uses the context of the page you opened it from. In Hive View, it uses the selected hive context, colony history, inspections, and resource distribution to summarize current state and recommend practical next steps when possible.
					</T>
				</p>
			</div>
			<HiveAdvisor
				apiary={apiary}
				hive={hive}
				hiveId={context.hiveId}
				autoAnalyze={true}
				showAnalyzeButton={false}
			/>
		</div>
	)
}
