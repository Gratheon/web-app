import T from '@/shared/translate'
import Loader from '@/shared/loader'
import Button from '@/shared/button'
import Modal from '@/shared/modal'

import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'

type HiveQrStickerModalProps = {
	isGeneratingQR: boolean
	qrStickerDataUrl: string | null
	onClose: () => void
	onDownload: () => void
}

export default function HiveQrStickerModal({
	isGeneratingQR,
	qrStickerDataUrl,
	onClose,
	onDownload,
}: HiveQrStickerModalProps) {
	return (
		<Modal
			title={<T>Hive QR sticker</T>}
			onClose={onClose}
			className={styles.qrModal}
		>
			<div className={styles.qrModalBody}>
				{isGeneratingQR && <Loader />}
				{!isGeneratingQR && qrStickerDataUrl && (
					<>
						<img
							src={qrStickerDataUrl}
							alt="Hive QR sticker"
							className={styles.qrPreview}
						/>
						<Button onClick={onDownload}>
							<T>Download sticker</T>
						</Button>
					</>
				)}
				{!isGeneratingQR && !qrStickerDataUrl && (
					<p className={styles.qrErrorText}>
						<T>Failed to generate QR sticker.</T>
					</p>
				)}
			</div>
		</Modal>
	)
}
