import React, { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import VisualForm from '@/shared/visualForm'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import type { User } from '@/models/user'
import { getUser, updateUser } from '@/models/user'
import T from '@/shared/translate'

import style from './style.module.less'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import DangerZone from './danger_zone'
import Card from '@/shared/pagePaddedCentered/card'
import { formatDateTimeByLocale, getBrowserLocale } from '@/shared/dateLocale'

const DETECTION_CONFIDENCE_OPTIONS = [40, 50, 60, 70, 80, 90]

type DetectionKey = 'bees' | 'drones' | 'queens' | 'queenCups' | 'varroa' | 'varroaBottom'
type DetectionPercents = Record<DetectionKey, number>

const DETECTION_ITEMS: Array<{ key: DetectionKey; label: string }> = [
	{ key: 'bees', label: 'Bees' },
	{ key: 'drones', label: 'Drones' },
	{ key: 'queens', label: 'Queens' },
	{ key: 'queenCups', label: 'Queen cups' },
	{ key: 'varroa', label: 'Varroa' },
	{ key: 'varroaBottom', label: 'Varroa (bottom board)' },
]

const LOCALE_OPTIONS = [
	'en-US',
	'en-GB',
	'de-DE',
	'es-ES',
	'et-EE',
	'fr-FR',
	'pl-PL',
	'pt-PT',
	'ru-RU',
	'tr-TR',
	'ja-JP',
	'zh-CN',
	'ar-SA',
	'hi-IN',
	'bn-BD',
]

export default function AccountEdit() {
	let [user, setUser] = useState<User>({})
	let [saving, setSaving] = useState<boolean>(false)
	const [detectionConfidencePercents, setDetectionConfidencePercents] = useState<DetectionPercents>({
		bees: 60,
		drones: 60,
		queens: 60,
		queenCups: 60,
		varroa: 60,
		varroaBottom: 60,
	})
	const [initialDetectionConfidencePercents, setInitialDetectionConfidencePercents] = useState<DetectionPercents>({
		bees: 60,
		drones: 60,
		queens: 60,
		queenCups: 60,
		varroa: 60,
		varroaBottom: 60,
	})
	const [sensitivityInitialized, setSensitivityInitialized] = useState(false)

	function onInput(e: any) {
		const { name, value } = e.target;

		setUser((prevState) => ({
			...prevState,
			[name]: value,
		}));
	}

	let { loading, data } = useQuery(gql`
		query user {
			user {
				... on User {
					id
					email
					first_name
					last_name
					lang
					locale
					date_expiration
					date_added
					hasSubscription
					isSubscriptionExpired
					billingPlan
				}
				
							
				... on Error {
					code
				}
			}
			detectionSettings {
				confidencePercents {
					bees
					drones
					queens
					queenCups
					varroa
					varroaBottom
				}
			}
		}
	`)


	let userStored = useLiveQuery(() =>  getUser(), [], null)

	let [updateAccount, { error }] = useMutation(gql`
		mutation updateUser($user: UserUpdateInput!) {
			updateUser(user: $user) {
				... on User {
					email
				}

				... on Error {
					code
				}
			}
		}
	`)

	let [setDetectionConfidencePercentsMutation, { error: detectionSettingsError }] = useMutation(gql`
		mutation setDetectionConfidencePercents($confidencePercents: DetectionConfidencePercentsInput!) {
			setDetectionConfidencePercents(confidencePercents: $confidencePercents) {
				confidencePercents {
					bees
					drones
					queens
					queenCups
					varroa
					varroaBottom
				}
			}
		}
	`)

	async function onSubmit(e: React.ChangeEvent) {
		e.preventDefault()

		setSaving(true);
		await updateAccount({
			user: {
				first_name: user?.first_name,
				last_name: user?.last_name,
				lang: user?.lang,
				locale: user?.locale,
			},
		})

		if (JSON.stringify(detectionConfidencePercents) !== JSON.stringify(initialDetectionConfidencePercents)) {
			await setDetectionConfidencePercentsMutation({
				confidencePercents: detectionConfidencePercents,
			})
			setInitialDetectionConfidencePercents(detectionConfidencePercents)
		}

		await updateUser({
			...userStored,
			...user
		})
		setSaving(false);
	}

	if(userStored && !user.id){
		setUser({
			...userStored,
			locale: userStored?.locale || getBrowserLocale(),
		})
	}

	useEffect(() => {
		if (sensitivityInitialized) return

		const serverConfidence = data?.detectionSettings?.confidencePercents
		if (!serverConfidence) return

		const normalized = {
			bees: Number(serverConfidence.bees) || 60,
			drones: Number(serverConfidence.drones) || 60,
			queens: Number(serverConfidence.queens) || 60,
			queenCups: Number(serverConfidence.queenCups) || 60,
			varroa: Number(serverConfidence.varroa) || 60,
			varroaBottom: Number(serverConfidence.varroaBottom) || 60,
		}
		setInitialDetectionConfidencePercents(normalized)
		setDetectionConfidencePercents(normalized)
		setSensitivityInitialized(true)
	}, [data?.detectionSettings?.confidencePercents, sensitivityInitialized])

	if (!user || !userStored || loading) {
		return <Loader />
	}

	const localePreview = formatDateTimeByLocale(
		new Date('2026-12-31T21:45:00Z'),
		{ dateStyle: 'full', timeStyle: 'short' },
		user.locale
	)

	return (
		<PagePaddedCentered>
			<h2><T>Account</T></h2>
			<ErrorMsg error={error || detectionSettingsError} />
			<Card>
				<div className={style.flexRow}>
					<VisualForm 
						className={style.visualForm} 
						onSubmit={onSubmit}
						submit={<Button type="submit" color='green' loading={saving}><T>Save</T></Button>}>
						<div>
							<label className={style.labelWide} htmlFor="first_name"><T ctx="this is a label for the person full name">Name</T></label>
							<input
								name="first_name"
								id="first_name"
								className={style.inputFirst}
								placeholder="First name"
								autoFocus
								value={user.first_name}
								onInput={onInput}
							/>
							<input
								name="last_name"
								id="last_name"
								className={style.inputLast}
								placeholder="Last name"
								autoFocus
								value={user.last_name}
								onInput={onInput}
							/>
						</div>
						<div>
							<label htmlFor="name"><T>Email</T></label>
							<input
								name="email"
								id="email"
								className={style.inputEmail}
								disabled={true}
								value={user.email}
							/>
						</div>
						<div>
							<label htmlFor="last_name"><T>Language</T></label>
							<select name="lang" onInput={onInput}>
                <option value="en" selected={user.lang == "en"}>English</option>
                <option value="zh" selected={user.lang == "zh"}>简体中文</option>
                <option value="hi" selected={user.lang == "hi"}>हिन्दी</option>
                <option value="es" selected={user.lang == "es"}>Español</option>
                <option value="fr" selected={user.lang == "fr"}>Français</option>
                <option value="ar" selected={user.lang == "ar"}>العربية</option>
                <option value="bn" selected={user.lang == "bn"}>বাংলা</option>
                <option value="pt" selected={user.lang == "pt"}>Português</option>
                <option value="ru" selected={user.lang == "ru"}>Русский</option>
                <option value="ja" selected={user.lang == "ja"}>日本語</option>

                <option value="de" selected={user.lang == "de"}>Deutsch</option>
                <option value="pl" selected={user.lang == "pl"}>Polski</option>
                <option value="tr" selected={user.lang == "tr"}>Türkçe</option>
                <option value="et" selected={user.lang == "et"}>Eesti</option>
							</select>
						</div>
						<div>
							<label htmlFor="locale"><T>Locale</T></label>
							<select name="locale" value={user.locale || getBrowserLocale()} onInput={onInput}>
								{LOCALE_OPTIONS.map((locale) => (
									<option key={locale} value={locale}>{locale}</option>
								))}
							</select>
							<div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#666' }}>
								<T>Date format preview</T>: {localePreview}
							</div>
						</div>
					</VisualForm>
				</div>
			</Card>
			<Card>
				<div className={style.detectionSettingsBlock}>
					<h3><T>AI detection sensitivity</T></h3>
					<p className={style.detectionSettingsHelp}>
						<T>
							Set minimum confidence for objects detected from uploaded images.
							These settings apply to frame image detections and bottom board varroa detections.
							All values below are percentages.
							Higher percentages are stricter and reduce false positives.
							Lower percentages detect more objects but may include more false positives.
						</T>
					</p>
					<div className={style.detectionSettingsGrid}>
						{DETECTION_ITEMS.map((item) => (
							<div key={item.key} className={style.detectionSettingsRow}>
								<div className={style.detectionSettingsLabel}><T>{item.label}</T></div>
								<div className={style.detectionSettingsOptions}>
									{DETECTION_CONFIDENCE_OPTIONS.map((value) => {
										const selected = detectionConfidencePercents[item.key] === value
										return (
											<button
												key={`${item.key}-${value}`}
												type="button"
												className={selected ? `${style.confidenceChip} ${style.confidenceChipSelected}` : style.confidenceChip}
												onClick={() =>
													setDetectionConfidencePercents((prev) => ({ ...prev, [item.key]: value }))
												}
												aria-pressed={selected}
											>
												{value}%
											</button>
										)
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			</Card>

			<DangerZone />
		</PagePaddedCentered>
	)
}
