import style from './style.module.less'

export default function Roof({ selected = false }) {
	return (
		<div className={`${style.roof} ${selected && style.selected} roof`}>
			<div className={style.lip}></div>
		</div>
	)
}
