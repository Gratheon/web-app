import T from '@/shared/translate'
import InspectionIcon from '@/icons/inspection'
import Button from '@/shared/button'
import Modal from '@/shared/modal'

import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'

type HiveInspectionModalProps = {
	inspectionDate: string
	creatingInspection: boolean
	onCancel: () => void
	onConfirm: (dateValue: string) => void
	onInspectionDateChange: (dateValue: string) => void
}

export default function HiveInspectionModal({
	inspectionDate,
	creatingInspection,
	onCancel,
	onConfirm,
	onInspectionDateChange,
}: HiveInspectionModalProps) {
	return (
		<Modal
			title={<T>Complete Inspection</T>}
			onClose={onCancel}
			className={styles.inspectionModal}
		>
			<div className={styles.inspectionModalBody}>
				<p>
					<T>
						Completing this inspection will save the current hive state and
						frame photos as a read-only historical record for analytics.
					</T>
				</p>
				<p>
					<T>
						This lets you track hive growth progress over time. After
						confirmation, current photos and frame statistics will be reset so
						you can upload photos for the next inspection.
					</T>
				</p>
				<label className={styles.inspectionDateField}>
					<span>
						<T>Inspection date</T>
					</span>
					<input
						type="date"
						value={inspectionDate}
						onInput={(event) =>
							onInspectionDateChange((event.target as HTMLInputElement).value)
						}
					/>
				</label>
				<p className={styles.inspectionDateHint}>
					<T>
						We prefill this with the oldest photo timestamp when available.
						Please adjust it if the inspection happened on another day.
					</T>
				</p>
				<div className={styles.inspectionModalActions}>
					<Button onClick={onCancel} disabled={creatingInspection}>
						<T>Cancel</T>
					</Button>
					<Button
						color="green"
						loading={creatingInspection}
						disabled={!inspectionDate}
						onClick={() => onConfirm(inspectionDate)}
					>
						<InspectionIcon /> <T>Complete Inspection</T>
					</Button>
				</div>
			</div>
		</Modal>
	)
}
