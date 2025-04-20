import Slider from '@/shared/slider'

import styles from './styles.module.less'

export default function ResourceEditRow({
	children,
	color,
	percent,
	onChange,
	onClick,
	textColor='white',
	expanded = false,
}) { 
	return <div className={expanded ? styles.sliderExpanded : styles.slider}>
		<div
			className={styles.picker}
			style={{ backgroundColor: color, color: textColor }}
			onClick={onClick}
		>
			{Math.round(percent)} %{expanded && children}
		</div>
		{expanded && (
			<Slider
				min={0}
				max={100}
				width={200}
				backgroundColor={color}
				onChange={onChange}
				value={percent}
			/>
		)}
	</div>
}
