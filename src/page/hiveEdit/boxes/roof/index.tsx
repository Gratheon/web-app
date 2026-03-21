import style from './style.module.less'
import { normalizeRoofStyle } from '@/models/boxes'

export default function Roof({ selected = false, roofStyle = 'FLAT' }) {
	const normalizedRoofStyle = normalizeRoofStyle(roofStyle)
	const isAngular = normalizedRoofStyle === 'ANGULAR'

	return (
		<div className={`${style.roof} ${selected && style.selected} ${isAngular ? style.angular : style.flat} roof`}>
			<div className={style.lip}></div>
		</div>
	)
}
