import style from './style.module.less'

export function Tab({ children, isSelected = false, onClick=()=>{}, variant = 'default' }) {
	const tabClass = variant === 'rounded'
		? `${style.tab} ${style.tabRounded} ${style.tabRoundedStyle} ${isSelected ? style.selected : ''}`
		: `${style.tab} ${isSelected ? style.selected : ''}`;

	return <div className={tabClass} onClick={onClick}>{children}</div>
}

export function TabBar({ children, variant = 'default' }) {
	const barClass = variant === 'rounded' ? style.tabBarRounded : style.tabBar;
	return <div className={barClass}>{children}</div>
}