import T from '../translate'
import styles from './index.less'
import { NavLink } from 'react-router-dom'

export default function SubMenu({ hasInspections, currentUrl, inspectionsUrl }) {
	if (!hasInspections) {
		return
	}

	return <div className={styles.submenu}>
		<NavLink
			className={({ isActive }) => isActive ? styles.active : ""}
			to={inspectionsUrl}><T>Inspection Timeline</T></NavLink>
	</div>
}