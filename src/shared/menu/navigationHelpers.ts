// @ts-nocheck
import styles from './styles.module.less'

const AI_ADVISOR_CONTEXT_KEY = 'ai-advisor-last-hive-context'

function combineClassNames(...classNames) {
	return classNames.filter(Boolean).join(' ')
}

export const navClassName = ({ isActive }) => (isActive ? styles.active : '')
export const menuLinkClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
export const sectionMenuLinkClassName =
	(isSectionActive, isLocked = false) =>
	() =>
		combineClassNames(
			isSectionActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
export const subMenuLinkClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			styles.subMenuLink,
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
export const mobileNavClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			styles.mobileNavLink,
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
export const mobileSectionNavClassName =
	(isSectionActive, isLocked = false) =>
	() =>
		combineClassNames(
			styles.mobileNavLink,
			isSectionActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
export const moreMenuLinkClassName =
	(isLocked = false) =>
	({ isActive }) =>
		combineClassNames(
			isActive && styles.active,
			isLocked && styles.lockedMenuLink
		)
export const utilityButtonClassName = (isSelected) =>
	isSelected
		? `${styles.utilityButton} ${styles.utilityButtonSelected}`
		: styles.utilityButton

export function getLockedNavigationProps(isLocked, onUnlockedClick) {
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

export function getCurrentHiveContext(pathname: string) {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/hives\/(\d+)(?:\/|$)/)
	if (!matches) {
		return null
	}

	return {
		apiaryId: +matches[1],
		hiveId: +matches[2],
	}
}

export function getStoredHiveContext() {
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
