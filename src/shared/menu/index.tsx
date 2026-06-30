// @ts-nocheck
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import Header from '@/shared/header'
import T from '@/shared/translate'
import Avatar from '@/shared/avatar'
import styles from './styles.module.less'
import HiveIcon from '@/icons/hive'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import * as userModel from '@/models/user'
import CreditCard from '@/icons/creditCard'
import KeyIcon from '@/icons/key'
import CalendarIcon from '@/icons/calendar'
import wideLogoURL from '@/assets/logo_v7w.svg'
import {
	isBillingTierAtLeast,
	normalizeBillingTier,
} from '@/shared/billingTier'
const AI_ADVISOR_CONTEXT_KEY = 'ai-advisor-last-hive-context'
const SHORTCUT_HINTS_EVENT = 'gratheon-shortcut-hints'
const SHORTCUT_HINTS_STORAGE_KEY = 'gratheon-shortcut-hints-visible'

import {
	AIAdvisorIcon,
	BearFaceIcon,
	DeviceSignalIcon,
	LogoutIcon,
	QueensIcon,
	SupportIcon,
	WarehouseIcon,
} from './mobileIcons'
import {
	getCurrentHiveContext,
	getLockedNavigationProps,
	getStoredHiveContext,
	menuLinkClassName,
	navClassName,
	sectionMenuLinkClassName,
	subMenuLinkClassName,
} from './navigationHelpers'
import MobileMenu from './MobileMenu'
import { onLogoutClick, openSupportChat } from './supportChat'
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

			<MobileMenu
				aiAdvisorPath={aiAdvisorPath}
				isAIAdvisorLocked={isAIAdvisorLocked}
				isAlertsLocked={isAlertsLocked}
				isApiariesSection={isApiariesSection}
				isDevicesLocked={isDevicesLocked}
				isFreeTier={isFreeTier}
				isInsightsLocked={isInsightsLocked}
				isInsightsSection={isInsightsSection}
				isMoreVisible={isMoreVisible}
				isQueensLocked={isQueensLocked}
				isWarehouseLocked={isWarehouseLocked}
				isWarehouseQueensSection={isWarehouseQueensSection}
				isWarehouseSection={isWarehouseSection}
				setMoreVisible={setMoreVisible}
			/>
		</>
	)
}

export default Menu
