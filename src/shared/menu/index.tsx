// @ts-nocheck
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import Header from '@/shared/header'
import { logout } from '@/user'
import { getAppUri } from '@/uri'
import T from '@/shared/translate'
import Avatar from '@/shared/avatar'
import styles from './styles.module.less'
import HiveIcon from '@/icons/hive'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import CryptoJS from 'crypto-js'
import * as userModel from '@/models/user'
import { TAWKTO_TOKEN } from '@/config'
import isDev from '@/isDev'
import CreditCard from '@/icons/creditCard'
import KeyIcon from '@/icons/key'
import CalendarIcon from '@/icons/calendar'
import wideLogoURL from '@/assets/logo_v7w.svg'
import {
	isBillingTierAtLeast,
	normalizeBillingTier,
} from '@/shared/billingTier'
const MOBILE_NAV_ICON_SIZE = 24
const AI_ADVISOR_CONTEXT_KEY = 'ai-advisor-last-hive-context'
const SHORTCUT_HINTS_EVENT = 'gratheon-shortcut-hints'
const SHORTCUT_HINTS_STORAGE_KEY = 'gratheon-shortcut-hints-visible'

async function onLogoutClick() {
	await logout()

	window.location.href = getAppUri() + '/account/authenticate/'
}

function generateHmac(message: string, secret: string) {
	return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex)
}

const TAWKTO_SCRIPT_URL =
	'https://embed.tawk.to/64b6ec5acc26a871b0293d74/1h5l8mh5h'
const TAWKTO_SCRIPT_ID = 'tawkto-support-chat-script'
const SUPPORT_FALLBACK_URL = 'https://gratheon.com'
let tawkScriptLoadingPromise: Promise<void> | null = null

function canLoadTawkSupportChat() {
	const hostname = window.location.hostname

	// WHY: production previews can run on localhost; WHAT: keep third-party support disabled for local/dev sessions.
	return !isDev() && hostname !== 'localhost' && hostname !== '127.0.0.1'
}

function getTawkApi() {
	window.Tawk_API = window.Tawk_API || {}
	return window.Tawk_API
}

function loadTawkScript() {
	const tawkApi = getTawkApi()

	if (
		typeof tawkApi.start === 'function' ||
		typeof tawkApi.maximize === 'function'
	) {
		return Promise.resolve()
	}

	if (tawkScriptLoadingPromise) {
		return tawkScriptLoadingPromise
	}

	// WHY: Tawk.to should not affect normal app navigation; WHAT: inject its remote script only after Support is clicked.
	window.Tawk_LoadStart = new Date()
	tawkApi.autoStart = false

	tawkScriptLoadingPromise = new Promise((resolve, reject) => {
		const existingScript = document.getElementById(TAWKTO_SCRIPT_ID)
		if (existingScript) {
			resolve()
			return
		}

		const script = document.createElement('script')
		const firstScript = document.getElementsByTagName('script')[0]

		script.id = TAWKTO_SCRIPT_ID
		script.async = true
		script.src = TAWKTO_SCRIPT_URL
		script.charset = 'UTF-8'
		script.setAttribute('crossorigin', '*')
		script.onload = () => resolve()
		script.onerror = () => {
			script.remove()
			tawkScriptLoadingPromise = null
			reject(new Error('Failed to load Tawk.to support chat'))
		}

		firstScript.parentNode.insertBefore(script, firstScript)
	})

	return tawkScriptLoadingPromise
}

function waitForTawkApi() {
	const tawkApi = window.Tawk_API

	if (
		typeof tawkApi?.start === 'function' ||
		typeof tawkApi?.maximize === 'function'
	) {
		return Promise.resolve(tawkApi)
	}

	// WHY: the script load event can fire before the widget API attaches methods; WHAT: wait briefly before falling back.
	return new Promise((resolve, reject) => {
		const startedAt = Date.now()
		const interval = window.setInterval(() => {
			const tawkApi = window.Tawk_API

			if (
				typeof tawkApi?.start === 'function' ||
				typeof tawkApi?.maximize === 'function'
			) {
				window.clearInterval(interval)
				resolve(tawkApi)
				return
			}

			if (Date.now() - startedAt > 5000) {
				window.clearInterval(interval)
				reject(new Error('Tawk.to API did not become ready'))
			}
		}, 50)
	})
}

function applyUserToTawk(tawkApi, userInfo, hash) {
	if (typeof tawkApi.login === 'function') {
		tawkApi.login(
			{
				hash,
				email: userInfo.email,
				name: `${userInfo.first_name} ${userInfo.last_name}`,
				userId: `${userInfo.id}`,
			},
			console.error
		)
	}

	if (typeof tawkApi.setAttributes === 'function') {
		tawkApi.setAttributes(
			{
				hash,
				email: userInfo.email,
				name: `${userInfo.first_name} ${userInfo.last_name}`,
			},
			console.error
		)
	}

	if (userInfo?.billingPlan && typeof tawkApi.addTags === 'function') {
		tawkApi.addTags([userInfo.billingPlan], console.error)
	}
}

async function openSupportChat() {
	if (!canLoadTawkSupportChat()) {
		window.location.href = SUPPORT_FALLBACK_URL
		return
	}

	const existingTawkApi = window?.Tawk_API

	if (typeof existingTawkApi?.maximize === 'function') {
		existingTawkApi.maximize()
		return
	}

	const userInfo = await userModel.getUser()
	if (!userInfo?.email) {
		window.location.href = SUPPORT_FALLBACK_URL
		return
	}

	const hash = await generateHmac(`${userInfo.email}`, TAWKTO_TOKEN)
	const tawkApi = getTawkApi()

	tawkApi.autoStart = false
	tawkApi.language = 'en'
	tawkApi.onLoad = async function () {
		applyUserToTawk(tawkApi, userInfo, hash)

		if (typeof tawkApi.maximize === 'function') {
			tawkApi.maximize()
		}
	}

	try {
		await loadTawkScript()
		const readyTawkApi = await waitForTawkApi()

		if (typeof readyTawkApi.start === 'function') {
			readyTawkApi.start({
				message: 'Hi, how can we help you today?',
			})
		}

		if (typeof readyTawkApi.maximize === 'function') {
			readyTawkApi.maximize()
		}
	} catch (error) {
		console.error(error)
		window.location.href = SUPPORT_FALLBACK_URL
	}
}

// Mobile nav icons accept `filled` so selection is conveyed by the icon shape together with the active color.
function HamburgerIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			{filled && (
				<rect
					x="3.5"
					y="4.5"
					width="17"
					height="15"
					rx="3.5"
					fill="currentColor"
				/>
			)}
			<rect
				x="6"
				y="8"
				width="12"
				height="2"
				rx="1"
				fill={filled ? 'white' : 'currentColor'}
			/>
			<rect
				x="6"
				y="11"
				width="12"
				height="2"
				rx="1"
				fill={filled ? 'white' : 'currentColor'}
			/>
			<rect
				x="6"
				y="14"
				width="12"
				height="2"
				rx="1"
				fill={filled ? 'white' : 'currentColor'}
			/>
		</svg>
	)
}

function LightBulbIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9.5 17H14.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M10 20H14"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M12 4C9.79 4 8 5.79 8 8C8 9.73 9.1 11.2 10.64 11.76C11.03 11.9 11.3 12.27 11.3 12.69V14H12.7V12.69C12.7 12.27 12.97 11.9 13.36 11.76C14.9 11.2 16 9.73 16 8C16 5.79 14.21 4 12 4Z"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			{filled && (
				<path
					d="M10.6 8.2L11.6 9.5L13.4 7.2"
					stroke="white"
					stroke-width="1.4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			)}
		</svg>
	)
}

function QueenFinderIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	const bodyFill = filled ? 'currentColor' : 'none'
	const detailColor = filled ? 'white' : 'currentColor'

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="2" />
			<path
				d="M14.5 14.5L20 20"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M8.2 9.2C6.7 8.2 6.7 6.4 8.1 6.2C9.2 6.1 9.8 7.3 10 8.8"
				fill={bodyFill}
				fill-opacity={filled ? '0.24' : '1'}
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<path
				d="M11.8 9.2C13.3 8.2 13.3 6.4 11.9 6.2C10.8 6.1 10.2 7.3 10 8.8"
				fill={bodyFill}
				fill-opacity={filled ? '0.24' : '1'}
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<ellipse
				cx="10"
				cy="10.9"
				rx="2.35"
				ry="3.35"
				fill={bodyFill}
				stroke="currentColor"
				stroke-width="1.6"
			/>
			<path
				d="M8 10.3H12"
				stroke={detailColor}
				stroke-width="1.2"
				stroke-linecap="round"
			/>
			<path
				d="M8.3 12.1H11.7"
				stroke={detailColor}
				stroke-width="1.2"
				stroke-linecap="round"
			/>
			<path
				d="M8.7 7.1L7.7 6"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
			<path
				d="M11.3 7.1L12.3 6"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</svg>
	)
}

function BearFaceIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="6.5"
				cy="7.5"
				r="2.5"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				cx="17.5"
				cy="7.5"
				r="2.5"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle cx="12" cy="13" r="6.5" stroke="currentColor" stroke-width="2" />
			<path
				d="M8.1 11.5L10.1 10.8"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<path
				d="M15.9 11.5L13.9 10.8"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<circle cx="9.5" cy="12.8" r="0.95" fill="currentColor" />
			<circle cx="14.5" cy="12.8" r="0.95" fill="currentColor" />
			<path d="M12 13.9 L10.7 15.5 H13.3 Z" fill="currentColor" />
			<path
				d="M9.9 16.1C10.6 15.5 11.4 15.2 12 15.2C12.6 15.2 13.4 15.5 14.1 16.1"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
			<path
				d="M11.2 16.1L11.55 17.1L11.9 16.1"
				stroke="currentColor"
				stroke-width="1.3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.1 16.1L12.45 17.1L12.8 16.1"
				stroke="currentColor"
				stroke-width="1.3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)
}

function AIAdvisorIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="6"
				y="5.5"
				width="12"
				height="11"
				rx="3"
				stroke="currentColor"
				stroke-width="2"
			/>
			<path
				d="M9.5 19H14.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<circle cx="10" cy="11" r="1.1" fill="currentColor" />
			<circle cx="14" cy="11" r="1.1" fill="currentColor" />
			<path
				d="M10.2 14.1C10.9 14.6 11.4 14.8 12 14.8C12.6 14.8 13.1 14.6 13.8 14.1"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
			<path
				d="M9 5.5V4.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M15 5.5V4.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

function WarehouseIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	const bodyFill = filled ? 'currentColor' : 'none'
	const detailColor = filled ? 'white' : 'currentColor'

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M4 10.5L12 6L20 10.5V18.5C20 19.05 19.55 19.5 19 19.5H5C4.45 19.5 4 19.05 4 18.5V10.5Z"
				fill={bodyFill}
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d="M4 10.5L12 15L20 10.5"
				stroke={detailColor}
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d="M12 15V19.5"
				stroke={detailColor}
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

function QueensIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5 18.5H19"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M6.5 18.5L8.5 9.5L12 13L15.5 9.5L17.5 18.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<circle
				cx="8.5"
				cy="7.5"
				r="1.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				cx="12"
				cy="5.5"
				r="1.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				cx="15.5"
				cy="7.5"
				r="1.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			/>
		</svg>
	)
}

function DeviceSignalIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="4.5"
				y="7"
				width="10"
				height="12"
				rx="2.2"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle cx="9.5" cy="16" r="1.1" fill="currentColor" />
			<path
				d="M17 9.2C18.6 10.8 18.6 13.4 17 15"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M19.6 6.6C22.6 9.6 22.6 14.4 19.6 17.4"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

function SupportIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M6 9.5C6 6.46 8.46 4 11.5 4H12.5C15.54 4 18 6.46 18 9.5V11.5C18 12.33 17.33 13 16.5 13H15V10.5C15 9.67 14.33 9 13.5 9H10.5C9.67 9 9 9.67 9 10.5V13H7.5C6.67 13 6 12.33 6 11.5V9.5Z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d="M12 13V15.5C12 17.43 10.43 19 8.5 19H8"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<rect
				x="5.5"
				y="8.5"
				width="2.5"
				height="6"
				rx="1.2"
				stroke="currentColor"
				stroke-width="1.8"
			/>
			<rect
				x="16"
				y="8.5"
				width="2.5"
				height="6"
				rx="1.2"
				stroke="currentColor"
				stroke-width="1.8"
			/>
		</svg>
	)
}

function LogoutIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M10 4H6.5C5.67 4 5 4.67 5 5.5V18.5C5 19.33 5.67 20 6.5 20H10"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M13 16L17 12L13 8"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 12H17"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

function combineClassNames(...classNames) {
	return classNames.filter(Boolean).join(' ')
}

const navClassName = ({ isActive }) => (isActive ? styles.active : '')
const menuLinkClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
const sectionMenuLinkClassName =
	(isSectionActive, isLocked = false) =>
	() =>
		combineClassNames(
			isSectionActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
const subMenuLinkClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			styles.subMenuLink,
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
const mobileNavClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			styles.mobileNavLink,
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
const mobileSectionNavClassName =
	(isSectionActive, isLocked = false) =>
	() =>
		combineClassNames(
			styles.mobileNavLink,
			isSectionActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
const moreMenuLinkClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
const utilityButtonClassName = (isSelected) =>
	isSelected
		? `${styles.utilityButton} ${styles.utilityButtonSelected}`
		: styles.utilityButton

function getLockedNavigationProps(isLocked, onUnlockedClick) {
	if (!isLocked) {
		return onUnlockedClick ? { onClick: onUnlockedClick } : {}
	}

	return {
		'aria-disabled': 'true',
		tabIndex: -1,
		onClick: (event) => {
			event.preventDefault()
			event.stopPropagation()
		},
	}
}

function getCurrentHiveContext(pathname: string) {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/hives\/(\d+)(?:\/|$)/)
	if (!matches) {
		return null
	}

	return {
		apiaryId: +matches[1],
		hiveId: +matches[2],
	}
}

function getStoredHiveContext() {
	try {
		const value = localStorage.getItem(AI_ADVISOR_CONTEXT_KEY)
		if (!value) return null

		const parsed = JSON.parse(value)
		if (!parsed?.apiaryId || !parsed?.hiveId) return null

		return {
			apiaryId: +parsed.apiaryId,
			hiveId: +parsed.hiveId,
		}
	} catch {
		return null
	}
}

const Menu = ({
	isLoggedIn = false,
	isSidebarCollapsed = false,
	onSidebarToggle = () => {},
}) => {
	if (!isLoggedIn) {
		return (
			<nav id={styles.menu}>
				<Header />
				<ul>
					<li>
						<NavLink activeClassName={styles.active} to="/account/authenticate">
							Authentication
						</NavLink>
					</li>
					<li>
						<NavLink activeClassName={styles.active} to="/account/register">
							Registration
						</NavLink>
					</li>
					{/*<li>*/}
					{/*	<Link activeClassName={styles.active} href="/account/restore">*/}
					{/*		Restoration*/}
					{/*	</Link>*/}
					{/*</li>*/}
				</ul>
			</nav>
		)
	}

	let [isMoreVisible, setMoreVisible] = useState(false)
	let [showShortcutHints, setShowShortcutHints] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const user = useLiveQuery(() => userModel.getUser(), [], null)
	const billingPlan = user?.billingPlan || 'free'
	const isFreeTier = normalizeBillingTier(billingPlan) === 'free'
	const isQueensLocked = !isBillingTierAtLeast(billingPlan, 'hobbyist')
	const isWarehouseLocked = !isBillingTierAtLeast(billingPlan, 'hobbyist')
	const isInsightsLocked = !isBillingTierAtLeast(billingPlan, 'professional')
	const isDevicesLocked = !isBillingTierAtLeast(billingPlan, 'professional')
	const isAlertsLocked = !isBillingTierAtLeast(billingPlan, 'professional')
	const isAIAdvisorLocked = !isBillingTierAtLeast(billingPlan, 'starter')

	const isApiariesSection =
		location.pathname === '/' ||
		location.pathname === '/apiaries' ||
		location.pathname.startsWith('/apiaries/')
	const isAlertsSection =
		location.pathname === '/alert-config' ||
		location.pathname.startsWith('/alert-config/')
	const isInsightsSection =
		location.pathname === '/insights' ||
		location.pathname.startsWith('/insights/')
	const isWarehouseQueensSection =
		location.pathname === '/warehouse/queens' ||
		location.pathname.startsWith('/warehouse/queens/')
	const isWarehouseSection =
		(location.pathname === '/warehouse' ||
			location.pathname.startsWith('/warehouse/')) &&
		!isWarehouseQueensSection
	const currentHiveContext = getCurrentHiveContext(location.pathname)
	const isHiveAdvisorOpen =
		new URLSearchParams(location.search).get('aiAdvisor') === '1'
	const isAIAdvisorSection =
		location.pathname === '/ai-advisor' ||
		location.pathname.startsWith('/ai-advisor/') ||
		isHiveAdvisorOpen
	const aiAdvisorPath = (() => {
		const nextParams = new URLSearchParams(location.search)
		nextParams.set('aiAdvisor', '1')
		const search = nextParams.toString()
		return `${location.pathname}${search ? `?${search}` : ''}`
	})()

	if (currentHiveContext) {
		localStorage.setItem(
			AI_ADVISOR_CONTEXT_KEY,
			JSON.stringify(currentHiveContext)
		)
	}

	useEffect(() => {
		if (!isHiveAdvisorOpen) {
			setShowShortcutHints(false)
		}
	}, [isHiveAdvisorOpen])

	useEffect(() => {
		if (showShortcutHints) {
			localStorage.setItem(SHORTCUT_HINTS_STORAGE_KEY, '1')
		} else {
			localStorage.removeItem(SHORTCUT_HINTS_STORAGE_KEY)
		}
		window.dispatchEvent(
			new CustomEvent(SHORTCUT_HINTS_EVENT, {
				detail: { visible: showShortcutHints },
			})
		)
	}, [showShortcutHints])

	useEffect(() => {
		const isTypingTarget = (target) => {
			if (!target) return false
			const tagName = String(target.tagName || '').toLowerCase()
			return (
				target.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			)
		}

		const onKeyDown = (event) => {
			if (isTypingTarget(event.target)) {
				return
			}

			const key = String(event.key || '').toLowerCase()

			if (key === 'escape') {
				setShowShortcutHints(false)
				return
			}

			const hasModifier = event.ctrlKey || event.metaKey || event.altKey
			const isAdvisorShortcut =
				event.shiftKey && (event.key === '?' || event.key === '/')
			const isMenuToggleShortcut =
				event.ctrlKey &&
				!event.metaKey &&
				!event.altKey &&
				!event.shiftKey &&
				key === 'm'
			const menuNavigationTarget =
				!hasModifier && !event.shiftKey
					? {
							'1': '/apiaries',
							'2': isFreeTier
								? '/warehouse/queens/detect'
								: isQueensLocked
								? null
								: '/warehouse/queens',
							'3': isInsightsLocked ? null : '/insights',
							'4': isWarehouseLocked ? null : '/warehouse',
							'5': isDevicesLocked ? null : '/devices',
							'6': isAlertsLocked ? null : '/alert-config',
							'7': '/account',
							'8': isAIAdvisorLocked ? null : aiAdvisorPath,
							'9': '/account/billing',
							'0': '/account/tokens',
					  }[key]
					: null

			if (
				!isAdvisorShortcut &&
				!isMenuToggleShortcut &&
				!menuNavigationTarget
			) {
				return
			}

			if (menuNavigationTarget) {
				event.preventDefault()
				navigate(menuNavigationTarget)
				return
			}

			if (isMenuToggleShortcut) {
				event.preventDefault()
				onSidebarToggle()
				return
			}

			if (isAdvisorShortcut && isAIAdvisorLocked) {
				event.preventDefault()
				return
			}

			if (event.repeat) {
				return
			}

			setShowShortcutHints(true)

			if (isAIAdvisorSection) {
				return
			}

			event.preventDefault()
			navigate(aiAdvisorPath, { replace: true })
		}

		const onWindowBlur = () => {
			setShowShortcutHints(false)
		}

		document.addEventListener('keydown', onKeyDown, true)
		window.addEventListener('blur', onWindowBlur)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
			window.removeEventListener('blur', onWindowBlur)
		}
	}, [
		aiAdvisorPath,
		isAIAdvisorSection,
		isAIAdvisorLocked,
		isAlertsLocked,
		isDevicesLocked,
		isFreeTier,
		isInsightsLocked,
		isQueensLocked,
		isWarehouseLocked,
		navigate,
		onSidebarToggle,
	])

	const onDesktopLogoClick = (event) => {
		event.preventDefault()
		onSidebarToggle()
	}

	return (
		<>
			{!isSidebarCollapsed && (
				<nav id={styles.menu} className={styles.desktopMenu}>
					<Header
						onLogoClick={onDesktopLogoClick}
						logoSrc={wideLogoURL}
						className={styles.expandedLogoHeader}
					/>

					<ul className={styles.menuSection}>
						<li>
							<NavLink className={navClassName} to="/apiaries">
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<HiveIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Hives</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>1</span>
										)}
									</span>
								</span>
							</NavLink>
						</li>
						{/* Free users can use Queen finder but not full Queens yet, so keep the available tool at the root level. */}
						{isFreeTier ? (
							<li>
								<NavLink
									className={sectionMenuLinkClassName(isWarehouseQueensSection)}
									to="/warehouse/queens/detect"
								>
									<span className={styles.menuItemContent}>
										<span className={styles.menuItemIcon}>
											<QueensIcon size={18} />
										</span>
										<span className={styles.menuItemLabel}>
											<span className={styles.menuItemText}>
												<T>Queen finder</T>
											</span>
											{showShortcutHints && (
												<span className={styles.keyHint}>2</span>
											)}
										</span>
									</span>
								</NavLink>
								<ul className={styles.subMenu}>
									<li>
										<NavLink
											className={subMenuLinkClassName(isQueensLocked)}
											to="/warehouse/queens"
											{...getLockedNavigationProps(isQueensLocked)}
										>
											<T>Queens</T>
										</NavLink>
									</li>
								</ul>
							</li>
						) : (
							<li>
								<NavLink
									className={sectionMenuLinkClassName(
										isWarehouseQueensSection,
										isQueensLocked
									)}
									to="/warehouse/queens"
									{...getLockedNavigationProps(isQueensLocked)}
								>
									<span className={styles.menuItemContent}>
										<span className={styles.menuItemIcon}>
											<QueensIcon size={18} />
										</span>
										<span className={styles.menuItemLabel}>
											<span className={styles.menuItemText}>
												<T>Queens</T>
											</span>
											{showShortcutHints && (
												<span className={styles.keyHint}>2</span>
											)}
										</span>
									</span>
								</NavLink>
								{isWarehouseQueensSection && (
									<ul className={styles.subMenu}>
										<li>
											<NavLink
												className={subMenuLinkClassName()}
												to="/warehouse/queens/detect"
											>
												<T>Queen finder</T>
											</NavLink>
										</li>
									</ul>
								)}
							</li>
						)}
						<li>
							<NavLink className={navClassName} to="/calendar">
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<CalendarIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Calendar</T>
										</span>
									</span>
								</span>
							</NavLink>
						</li>
						<li>
							<NavLink
								className={menuLinkClassName(isInsightsLocked)}
								to="/insights"
								{...getLockedNavigationProps(isInsightsLocked)}
							>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<LightBulbIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Analytics</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>3</span>
										)}
									</span>
								</span>
							</NavLink>
						</li>
						<li>
							<NavLink
								className={sectionMenuLinkClassName(
									isWarehouseSection,
									isWarehouseLocked
								)}
								to="/warehouse"
								{...getLockedNavigationProps(isWarehouseLocked)}
							>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<WarehouseIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Warehouse</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>4</span>
										)}
									</span>
								</span>
							</NavLink>
							{isWarehouseSection && (
								<ul className={styles.subMenu}>
									<li>
										<NavLink
											className={subMenuLinkClassName(isWarehouseLocked)}
											to="/warehouse/box-systems"
											{...getLockedNavigationProps(isWarehouseLocked)}
										>
											<T>Hive systems</T>
										</NavLink>
									</li>
								</ul>
							)}
						</li>
						<li>
							<NavLink
								className={menuLinkClassName(isDevicesLocked)}
								to="/devices"
								{...getLockedNavigationProps(isDevicesLocked)}
							>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<DeviceSignalIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Devices</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>5</span>
										)}
									</span>
								</span>
							</NavLink>
						</li>
						<li>
							<NavLink
								className={sectionMenuLinkClassName(
									isAlertsSection,
									isAlertsLocked
								)}
								to="/alert-config"
								{...getLockedNavigationProps(isAlertsLocked)}
							>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<BearFaceIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Alerts</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>6</span>
										)}
									</span>
								</span>
							</NavLink>
							{isAlertsSection && (
								<ul className={styles.subMenu}>
									<li>
										<NavLink
											className={subMenuLinkClassName(isAlertsLocked)}
											to="/alert-config/channels"
											{...getLockedNavigationProps(isAlertsLocked)}
										>
											<T>Channels</T>
										</NavLink>
									</li>
									<li>
										<NavLink
											className={subMenuLinkClassName(isAlertsLocked)}
											to="/alert-config/rules"
											{...getLockedNavigationProps(isAlertsLocked)}
										>
											<T>Rules</T>
										</NavLink>
									</li>
								</ul>
							)}
						</li>
					</ul>
					<div style="flex-grow:1"></div>

					<ul className={styles.menuSection}>
						<li>
							<NavLink end className={navClassName} to="/account">
								<div style="display:flex;" className={styles.menuItemLabel}>
									<Avatar style="margin-right:5px;" />
									<span className={styles.menuItemText}>
										<T>Account</T>
									</span>
									{showShortcutHints && (
										<span className={styles.keyHint}>7</span>
									)}
								</div>
							</NavLink>
						</li>
						<li>
							<NavLink
								className={sectionMenuLinkClassName(
									isAIAdvisorSection,
									isAIAdvisorLocked
								)}
								to={aiAdvisorPath}
								{...getLockedNavigationProps(isAIAdvisorLocked)}
							>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<AIAdvisorIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>AI Advisor</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>8</span>
										)}
									</span>
								</span>
							</NavLink>
						</li>
						<li>
							<NavLink className={navClassName} to="/account/billing">
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<CreditCard size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>Billing</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>9</span>
										)}
									</span>
								</span>
							</NavLink>
						</li>
						<li>
							<NavLink className={navClassName} to="/account/tokens">
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<KeyIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<span className={styles.menuItemText}>
											<T>API tokens</T>
										</span>
										{showShortcutHints && (
											<span className={styles.keyHint}>0</span>
										)}
									</span>
								</span>
							</NavLink>
						</li>

						<li>
							<a
								href="#"
								onClick={(event) => {
									event.preventDefault()
									openSupportChat()
								}}
							>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<SupportIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<T>Support</T>
									</span>
								</span>
							</a>
						</li>

						<li>
							<a href="#" onClick={onLogoutClick}>
								<span className={styles.menuItemContent}>
									<span className={styles.menuItemIcon}>
										<LogoutIcon size={18} />
									</span>
									<span className={styles.menuItemLabel}>
										<T>Log out</T>
									</span>
								</span>
							</a>
						</li>
					</ul>
				</nav>
			)}

			{isSidebarCollapsed && (
				<div className={styles.collapsedLogoTrigger}>
					<Header
						onLogoClick={onDesktopLogoClick}
						className={styles.collapsedLogoHeader}
					/>
				</div>
			)}

			<div className={styles.mobileHeader}>
				<Header />
			</div>

			<nav className={styles.mobileBottomMenu}>
				<ul className={styles.mobileBottomList}>
					<li>
						<NavLink
							className={mobileSectionNavClassName(isApiariesSection)}
							to="/apiaries"
							onClick={() => {
								setMoreVisible(false)
							}}
						>
							<span className={styles.navIcon}>
								<HiveIcon
									size={MOBILE_NAV_ICON_SIZE}
									selected={isApiariesSection}
								/>
							</span>
							<span className={styles.navLabel}>
								<T>Hives</T>
							</span>
						</NavLink>
					</li>
					<li>
						<NavLink
							className={mobileSectionNavClassName(
								isWarehouseQueensSection,
								isQueensLocked && !isFreeTier
							)}
							to={isFreeTier ? '/warehouse/queens/detect' : '/warehouse/queens'}
							{...getLockedNavigationProps(
								isQueensLocked && !isFreeTier,
								() => {
									setMoreVisible(false)
								}
							)}
						>
							<span className={styles.navIcon}>
								{isFreeTier ? (
									<QueenFinderIcon
										size={MOBILE_NAV_ICON_SIZE}
										filled={isWarehouseQueensSection}
									/>
								) : (
									<QueensIcon
										size={MOBILE_NAV_ICON_SIZE}
										filled={isWarehouseQueensSection}
									/>
								)}
							</span>
							<span className={styles.navLabel}>
								{isFreeTier ? <T>Queen finder</T> : <T>Queens</T>}
							</span>
						</NavLink>
					</li>
					<li>
						<NavLink
							end
							className={mobileSectionNavClassName(
								isWarehouseSection,
								isWarehouseLocked
							)}
							to="/warehouse"
							{...getLockedNavigationProps(isWarehouseLocked, () => {
								setMoreVisible(false)
							})}
						>
							<span className={styles.navIcon}>
								<WarehouseIcon
									size={MOBILE_NAV_ICON_SIZE}
									filled={isWarehouseSection}
								/>
							</span>
							<span className={styles.navLabel}>
								<T>Warehouse</T>
							</span>
						</NavLink>
					</li>
					<li>
						<NavLink
							className={mobileSectionNavClassName(
								isInsightsSection,
								isInsightsLocked
							)}
							to="/insights"
							{...getLockedNavigationProps(isInsightsLocked, () => {
								setMoreVisible(false)
							})}
						>
							<span className={styles.navIcon}>
								<LightBulbIcon
									size={MOBILE_NAV_ICON_SIZE}
									filled={isInsightsSection}
								/>
							</span>
							<span className={styles.navLabel}>
								<T>Analytics</T>
							</span>
						</NavLink>
					</li>
					<li>
						<button
							className={utilityButtonClassName(isMoreVisible)}
							onClick={() => {
								setMoreVisible(!isMoreVisible)
							}}
							type="button"
							aria-label="More"
						>
							<span className={styles.navIcon}>
								<HamburgerIcon
									size={MOBILE_NAV_ICON_SIZE}
									filled={isMoreVisible}
								/>
							</span>
							<span className={styles.navLabel}>
								<T>More</T>
							</span>
						</button>
					</li>
				</ul>
			</nav>
			{isMoreVisible && (
				<div className={styles.mobileMoreMenu}>
					<NavLink
						to="/calendar"
						onClick={() => {
							setMoreVisible(false)
						}}
					>
						<T>Calendar</T>
					</NavLink>
					<NavLink
						to={aiAdvisorPath}
						className={moreMenuLinkClassName(isAIAdvisorLocked)}
						{...getLockedNavigationProps(isAIAdvisorLocked, () => {
							setMoreVisible(false)
						})}
					>
						<T>AI Advisor</T>
					</NavLink>
					<NavLink
						to="/alert-config"
						className={moreMenuLinkClassName(isAlertsLocked)}
						{...getLockedNavigationProps(isAlertsLocked, () => {
							setMoreVisible(false)
						})}
					>
						<T>Alerts</T>
					</NavLink>
					{isFreeTier ? (
						<>
							<NavLink
								to="/warehouse/queens/detect"
								className={moreMenuLinkClassName()}
								onClick={() => {
									setMoreVisible(false)
								}}
							>
								<T>Queen finder</T>
							</NavLink>
							<NavLink
								to="/warehouse/queens"
								className={moreMenuLinkClassName(isQueensLocked)}
								{...getLockedNavigationProps(isQueensLocked, () => {
									setMoreVisible(false)
								})}
							>
								<span className={styles.mobileSubMenuItem}>
									<T>Queens</T>
								</span>
							</NavLink>
						</>
					) : (
						<>
							<NavLink
								to="/warehouse/queens"
								className={moreMenuLinkClassName(isQueensLocked)}
								{...getLockedNavigationProps(isQueensLocked, () => {
									setMoreVisible(false)
								})}
							>
								<T>Queens</T>
							</NavLink>
							<NavLink
								to="/warehouse/queens/detect"
								className={moreMenuLinkClassName()}
								onClick={() => {
									setMoreVisible(false)
								}}
							>
								<span className={styles.mobileSubMenuItem}>
									<T>Queen finder</T>
								</span>
							</NavLink>
						</>
					)}
					<NavLink
						end
						to="/warehouse"
						className={moreMenuLinkClassName(isWarehouseLocked)}
						{...getLockedNavigationProps(isWarehouseLocked, () => {
							setMoreVisible(false)
						})}
					>
						<T>Warehouse</T>
					</NavLink>
					<NavLink
						to="/warehouse/box-systems"
						className={moreMenuLinkClassName(isWarehouseLocked)}
						{...getLockedNavigationProps(isWarehouseLocked, () => {
							setMoreVisible(false)
						})}
					>
						<span className={styles.mobileSubMenuItem}>
							<T>Hive systems</T>
						</span>
					</NavLink>
					<NavLink
						to="/devices"
						className={moreMenuLinkClassName(isDevicesLocked)}
						{...getLockedNavigationProps(isDevicesLocked, () => {
							setMoreVisible(false)
						})}
					>
						<T>Devices</T>
					</NavLink>
					<NavLink
						to="/account"
						onClick={() => {
							setMoreVisible(false)
						}}
					>
						<T>Account</T>
					</NavLink>
					<NavLink
						to="/account/billing"
						onClick={() => {
							setMoreVisible(false)
						}}
					>
						<T>Billing</T>
					</NavLink>
					<NavLink
						to="/account/tokens"
						onClick={() => {
							setMoreVisible(false)
						}}
					>
						<T>API tokens</T>
					</NavLink>
					<a
						href="https://gratheon.com/terms"
						onClick={() => setMoreVisible(false)}
					>
						<T ctx="link in page footer">Terms of Use</T>
					</a>
					<a
						href="https://gratheon.com/privacy"
						onClick={() => setMoreVisible(false)}
					>
						<T ctx="link in page footer">Privacy policy</T>
					</a>
					<button
						type="button"
						onClick={() => {
							openSupportChat()
							setMoreVisible(false)
						}}
					>
						<T>Support</T>
					</button>
					<button
						type="button"
						onClick={async () => {
							setMoreVisible(false)
							await onLogoutClick()
						}}
					>
						<T>Log out</T>
					</button>
				</div>
			)}
		</>
	)
}

export default Menu
