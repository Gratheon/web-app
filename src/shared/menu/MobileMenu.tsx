// @ts-nocheck
import { NavLink } from 'react-router-dom'

import HiveIcon from '@/icons/hive'
import T from '@/shared/translate'
import styles from './styles.module.less'
import {
	HamburgerIcon,
	LightBulbIcon,
	MOBILE_NAV_ICON_SIZE,
	QueenFinderIcon,
	QueensIcon,
	WarehouseIcon,
} from './mobileIcons'
import {
	getLockedNavigationProps,
	mobileSectionNavClassName,
	moreMenuLinkClassName,
	utilityButtonClassName,
} from './navigationHelpers'
import { onLogoutClick, openSupportChat } from './supportChat'

const MobileMenu = ({
	aiAdvisorPath,
	isAIAdvisorLocked,
	isAlertsLocked,
	isApiariesSection,
	isDevicesLocked,
	isFreeTier,
	isInsightsLocked,
	isInsightsSection,
	isMoreVisible,
	isQueensLocked,
	isWarehouseLocked,
	isWarehouseQueensSection,
	isWarehouseSection,
	setMoreVisible,
}) => {
	return (
		<>
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

export default MobileMenu
