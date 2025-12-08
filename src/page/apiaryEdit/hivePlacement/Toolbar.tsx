import Button from '../../../shared/button'
import T from '../../../shared/translate'

interface ToolbarProps {
	addingObstacle: 'CIRCLE' | 'RECTANGLE' | null
	selectedHive: string | null
	selectedObstacle: string | null
	sunAngle: number
	autoRotate: boolean
	onAddObstacle: (type: 'CIRCLE' | 'RECTANGLE') => void
	onRotateHive: (direction: number) => void
	onDeleteObstacle: () => void
	onSunAngleChange: (angle: number) => void
	onAutoRotateChange: (autoRotate: boolean) => void
}

export default function Toolbar({
	addingObstacle,
	selectedHive,
	selectedObstacle,
	sunAngle,
	autoRotate,
	onAddObstacle,
	onRotateHive,
	onDeleteObstacle,
	onSunAngleChange,
	onAutoRotateChange
}: ToolbarProps) {
	return (
		<>
			<div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', padding: '0 20px' }}>
				<Button onClick={() => onAddObstacle('CIRCLE')} color={addingObstacle === 'CIRCLE' ? 'green' : undefined}>
					<T>Add Tree</T>
				</Button>
				<Button onClick={() => onAddObstacle('RECTANGLE')} color={addingObstacle === 'RECTANGLE' ? 'green' : undefined}>
					<T>Add Building</T>
				</Button>
				{selectedHive && (
					<>
						<Button onClick={() => onRotateHive(-15)}><T>Rotate Left</T></Button>
						<Button onClick={() => onRotateHive(15)}><T>Rotate Right</T></Button>
					</>
				)}
				{selectedObstacle && (
					<Button onClick={onDeleteObstacle} color="red">
						<T>Delete Obstacle</T>
					</Button>
				)}
			</div>

			<div style={{ marginBottom: '20px', padding: '0 20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<label>
						<T>Sun Position</T>: {sunAngle}° ({sunAngle === 90 ? 'E' : sunAngle === 180 ? 'S' : sunAngle === 270 ? 'W' : ''})
					</label>
					<input
						type="range"
						min="90"
						max="270"
						value={sunAngle}
						onChange={(e) => onSunAngleChange(parseInt((e.target as HTMLInputElement).value))}
						style={{ width: '300px' }}
					/>
					<label>
						<input type="checkbox" checked={autoRotate} onChange={(e) => onAutoRotateChange((e.target as HTMLInputElement).checked)} />
						<T>Auto-rotate</T>
					</label>
				</div>
			</div>
		</>
	)
}

