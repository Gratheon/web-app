import style from './style.module.less'

export default function Bottom({ selected = false }) {
	return (
		<div className={`${style.bottom} ${selected && style.selected} bottom`}>
			<div className={`${style.sideSupport} bottom`}></div>
			<div className={`${style.baseBoard} bottom`}></div>
			<div className={`${style.sideSupport} bottom`}></div>
		</div>
	)
}

