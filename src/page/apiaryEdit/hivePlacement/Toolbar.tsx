import Button from '../../../shared/button'
import T from '../../../shared/translate'

interface ToolbarProps {
	addingObstacle: 'CIRCLE' | 'RECTANGLE' | null
	selectedHive: string | null
	selectedObstacle: string | null
	isMobile: boolean
	showHiveList: boolean
	onAddObstacle: (type: 'CIRCLE' | 'RECTANGLE') => void
	onRotateHive: (direction: number) => void
	onDeleteObstacle: () => void
	onToggleHiveList: () => void
}

export default function Toolbar({
	addingObstacle,
	selectedHive,
	selectedObstacle,
	isMobile,
	showHiveList,
	onAddObstacle,
	onRotateHive,
	onDeleteObstacle,
	onToggleHiveList
}: ToolbarProps) {
	return (
		<>
			<div style={{
				display: 'flex',
				gap: isMobile ? '8px' : '20px',
				marginTop: '20px',
				marginBottom: '20px',
				flexWrap: 'wrap',
				padding: '0 20px'
			}}>
				{isMobile && (
					<Button
						onClick={onToggleHiveList}
						color={showHiveList ? 'blue' : undefined}
						style={{
							fontSize: isMobile ? '14px' : undefined,
							padding: isMobile ? '10px 12px' : undefined
						}}
					>
						<T>{showHiveList ? 'Hide Hives' : 'Show Hives'}</T>
					</Button>
				)}
				<Button
					onClick={() => onAddObstacle('CIRCLE')}
					color={addingObstacle === 'CIRCLE' ? 'green' : undefined}
					style={{
						fontSize: isMobile ? '14px' : undefined,
						padding: isMobile ? '10px 12px' : undefined
					}}
				>
					{isMobile ? '🌳' : <T>Add Tree</T>}
				</Button>
				<Button
					onClick={() => onAddObstacle('RECTANGLE')}
					color={addingObstacle === 'RECTANGLE' ? 'green' : undefined}
					style={{
						fontSize: isMobile ? '14px' : undefined,
						padding: isMobile ? '10px 12px' : undefined
					}}
				>
					{isMobile ? '🏠' : <T>Add Building</T>}
				</Button>
				{selectedHive && (
					<>
						<Button
							onClick={() => onRotateHive(-15)}
							style={{
								fontSize: isMobile ? '14px' : undefined,
								padding: isMobile ? '10px 12px' : undefined
							}}
						>
							{isMobile ? '↶' : <T>Rotate Left</T>}
						</Button>
						<Button
							onClick={() => onRotateHive(15)}
							style={{
								fontSize: isMobile ? '14px' : undefined,
								padding: isMobile ? '10px 12px' : undefined
							}}
						>
							{isMobile ? '↷' : <T>Rotate Right</T>}
						</Button>
					</>
				)}
				{selectedObstacle && (
					<Button
						onClick={onDeleteObstacle}
						color="red"
						style={{
							fontSize: isMobile ? '14px' : undefined,
							padding: isMobile ? '10px 12px' : undefined
						}}
					>
						{isMobile ? '🗑️' : <T>Delete Obstacle</T>}
					</Button>
				)}
			</div>
		</>
	)
}

