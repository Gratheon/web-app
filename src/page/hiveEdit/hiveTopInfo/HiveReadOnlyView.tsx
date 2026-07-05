import T from '@/shared/translate'
import HiveIcon from '@/shared/hive'
import BeeCounter from '@/shared/beeCounter'
import QrCodeIcon from '@/icons/qrCodeIcon'
import SkullIcon from '@/icons/SkullIcon'
import DateFormat from '@/shared/dateFormat'

import { isCollapsed } from '@/models/hive'
import QueenSlot from '@/page/hiveEdit/hiveTopInfo/QueenSlot'
import HiveStatistics from '@/page/hiveEdit/hiveStatistics'
import HivePlacementMiniMap from '@/page/hiveEdit/hiveTopInfo/HivePlacementMiniMap'
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'

type HiveReadOnlyViewProps = {
	hive: any
	boxes: any
	families: any[]
	apiaryId: string
	hiveId: string
	buttons: any
	buttonsDesktop: any
	displayedBoxSystem: any
	displayedBoxSystemColor: string
	isHorizontalHive: boolean
	isHiveMiniMapLocked: boolean
	isMobileApiary: boolean
	hiveCreatedIconRef: any
	onGoToHiveView: (event: any) => void
	onGenerateQR: () => void
	onNavigateToQueenLastSeen: (family: any) => void
	onEmptyQueenSlotClick: () => void
}

export default function HiveReadOnlyView({
	hive,
	boxes,
	families,
	apiaryId,
	hiveId,
	buttons,
	buttonsDesktop,
	displayedBoxSystem,
	displayedBoxSystemColor,
	isHorizontalHive,
	isHiveMiniMapLocked,
	isMobileApiary,
	hiveCreatedIconRef,
	onGoToHiveView,
	onGenerateQR,
	onNavigateToQueenLastSeen,
	onEmptyQueenSlotClick,
}: HiveReadOnlyViewProps) {
	return (
		<div style="padding: 0 10px;">
			<div className={styles.spotlight_wrap}>
				<div className={styles.spotlight_icon}>
					<div
						ref={hiveCreatedIconRef}
						className={styles.icon_wrap}
						onClick={onGoToHiveView}
						style={{ cursor: 'pointer' }}
						title="Go to hive view"
					>
						<HiveIcon boxes={boxes} />
					</div>
					<BeeCounter count={hive.beeCount} />
				</div>

				<div className={styles.name_race_wrap}>
					<div className={styles.hiveTitleRow}>
						<h1 className={styles.hiveTitle} onClick={onGoToHiveView}>
							{hive.hiveNumber ? (
								`Hive #${hive.hiveNumber}`
							) : (
								<T>Hive without number</T>
							)}
						</h1>
						<button
							type="button"
							className={styles.hiveTitleQrButton}
							title="Generate QR sticker for this hive"
							aria-label="Generate QR sticker for this hive"
							onClick={onGenerateQR}
						>
							<QrCodeIcon size={16} />
						</button>
					</div>
					<div className={styles.wrap4}>
						<div className={styles.titleQueenWrap}>
							<div className={styles.metaRow}>
								<div className={styles.metaLabel}>
									<T>Hive system</T>
								</div>
								<div className={styles.metaValue}>
									<span className={styles.boxSystemValue}>
										<span
											className={styles.boxSystemDot}
											style={{ backgroundColor: displayedBoxSystemColor }}
										></span>
										<span>
											{isHorizontalHive
												? 'Independent (Horizontal)'
												: displayedBoxSystem?.name || 'Unknown'}
										</span>
									</span>
								</div>
							</div>
							<div className={styles.metaRow}>
								<div className={styles.metaLabel}>
									<T>Queen</T>
								</div>
								<div className={styles.metaValue}>
									<div id={styles.queenSection}>
										<QueenSlot
											families={families}
											editable={false}
											onAddQueen={() => {}}
											onRemoveQueen={() => {}}
											onNavigateToLastSeen={onNavigateToQueenLastSeen}
											onEmptySlotClick={onEmptyQueenSlotClick}
										/>
									</div>
								</div>
							</div>

							{hive && isCollapsed(hive) && (
								<div className={styles.collapsedLabel}>
									{hive.collapse_date && (
										<>
											<DateFormat datetime={hive.collapse_date} />{' '}
										</>
									)}
									<SkullIcon
										size={14}
										color="#b22222"
										style={{ marginRight: 4 }}
									/>
									<T>Collapsed</T>
								</div>
							)}
							<HiveStatistics hiveId={hiveId} />
							{hive.notes && <p className={styles.hiveNotes}>{hive.notes}</p>}
						</div>
						{!isHiveMiniMapLocked && !isMobileApiary && (
							<div className={styles.desktopMiniMapWrap}>
								<HivePlacementMiniMap
									apiaryId={apiaryId}
									selectedHiveId={hiveId}
								/>
							</div>
						)}
					</div>

					{hive && isCollapsed(hive) && hive.collapse_cause && (
						<>
							{' '}
							<T>Collapse cause</T>: {hive.collapse_cause}
						</>
					)}
				</div>

				<div className={styles.button_wrap1}>{buttonsDesktop}</div>
			</div>

			<div className={styles.button_wrap2}>{buttons}</div>
		</div>
	)
}
