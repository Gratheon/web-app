import T from '../../../shared/translate'

export default function Tips() {
	return (
		<div style={{ marginTop: '20px', margin: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
			<h4><T>Tips</T>:</h4>
			<ul>
				<li><T>Click on a hive to select it, then drag to move</T></li>
				<li><T>When hive is selected, drag the blue rotation handle or use buttons to adjust entrance direction</T></li>
				<li><T>Hold Shift or use Right/Middle mouse button to pan the canvas</T></li>
				<li><T>Hive shadow height is automatically calculated from number of boxes</T></li>
				<li><T>Blue arrow shows entrance direction - avoid facing north or other hives</T></li>
				<li><T>Click obstacles to select, drag to move, resize, or rotate them</T></li>
				<li><T>Blue handle on obstacles = resize, Orange handle = rotate (rectangles only)</T></li>
				<li><T>Green handle below obstacles = adjust height (affects shadow length)</T></li>
				<li><T>Sun moves around compass (top right) from East → South → West</T></li>
				<li><T>Realistic polygonal shadows help visualize sun impact throughout the day</T></li>
				<li><T>Consider flight patterns - hives should not be in line with each other</T></li>
			</ul>
		</div>
	)
}

