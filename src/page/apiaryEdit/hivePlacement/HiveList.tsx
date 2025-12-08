import { HivePlacement, Hive } from './types'
import T from '../../../shared/translate'

interface HiveListProps {
	hives: Hive[]
	placements: Map<string, HivePlacement>
	selectedHive: string | null
	onSelectHive: (hiveId: string | null) => void
}

export default function HiveList({ hives, placements, selectedHive, onSelectHive }: HiveListProps) {
	return (
		<div style={{
			padding: '10px 20px',
			marginBottom: '10px',
			backgroundColor: '#f5f5f5',
			borderRadius: '8px',
			maxHeight: '200px',
			overflowY: 'auto'
		}}>
			<div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
				<T>Select Hive</T>:
			</div>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
				{hives.map(hive => {
					const isSelected = selectedHive === hive.id
					const placement = placements.get(hive.id)

					return (
						<button
							key={hive.id}
							onClick={() => onSelectHive(isSelected ? null : hive.id)}
							style={{
								padding: '12px 8px',
								backgroundColor: isSelected ? '#FFD54F' : '#fff',
								border: isSelected ? '3px solid #FFA000' : '2px solid #ddd',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: isSelected ? 'bold' : 'normal',
								textAlign: 'center',
								transition: 'all 0.2s',
								minHeight: '60px',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'center',
								gap: '4px'
							}}
						>
							<div>#{hive.hiveNumber || hive.id.slice(0, 4)}</div>
							{placement && (
								<div style={{ fontSize: '10px', color: '#666' }}>
									{Math.round(placement.rotation)}°
								</div>
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}

