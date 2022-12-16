import React from 'react'
import style from './index.less'

export default ({
	backgroundColor = 'black',
	value,
	width = 100,
	onChange,
	min = 0,
	max = 100,
}) => {
	const perc = ~~(((1 * value - min) / (max - min)) * 100) + '%'
	const bgStyle = {
		backgroundColor,
		width: perc,
	}

	return (
		<div className={style.wrapper} style={`width:${width}px`}>
			<input
				type="range"
				onInput={onChange}
				onChange={onChange}
				min={min}
				max={max}
				step="1"
				value={value || 0}
				data-before
			/>

			<div className={style.bg}>
				<div style={bgStyle} className={style.value}></div>
				<div style="background-color: black;flex-grow:1;"></div>
			</div>
		</div>
	)
}
