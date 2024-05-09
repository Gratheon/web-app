import style from './style.less'

export default function Ventilation({selected=false}) {
	return <div className={`${style.ventilation} ${selected && style.selected}`}>
		<div className={style.hole}></div>
	</div>
}