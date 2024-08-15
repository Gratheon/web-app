import style from './style.module.less'

export function Tab({ children, isSelected = false, onClick }) {
	return <div className={style.tab + ` ` + (isSelected ? style.selected : '')} onClick={onClick}>{children}</div>
}

export function TabBar({ children }) {
	return <div className={style.tabBar}>{children}</div>
}