import QRCode from 'qrcode'

import logoUrl from '@/assets/logo-v7.png'

const QR_SIZE = 1000
const LOGO_SIZE_RATIO = 0.2
const LOGO_BACKGROUND_PADDING = 5

export async function generateHiveQrStickerDataUrl(url: string) {
	const canvas = document.createElement('canvas')

	await QRCode.toCanvas(canvas, url, {
		width: QR_SIZE,
		errorCorrectionLevel: 'H',
		margin: 1,
	})

	const logo = await loadImage(logoUrl)
	const ctx = canvas.getContext('2d')
	if (!ctx) {
		throw new Error('Could not get canvas context')
	}

	const logoSize = QR_SIZE * LOGO_SIZE_RATIO
	const logoX = (QR_SIZE - logoSize) / 2
	const logoY = (QR_SIZE - logoSize) / 2

	ctx.fillStyle = '#FFFFFF'
	ctx.fillRect(
		logoX - LOGO_BACKGROUND_PADDING,
		logoY - LOGO_BACKGROUND_PADDING,
		logoSize + LOGO_BACKGROUND_PADDING * 2,
		logoSize + LOGO_BACKGROUND_PADDING * 2
	)
	ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

	return canvas.toDataURL('image/png')
}

export function downloadHiveQrSticker(
	qrStickerDataUrl: string,
	hiveId: string | number
) {
	const link = document.createElement('a')
	link.href = qrStickerDataUrl
	link.download = `hive-${hiveId}-qr-sticker.png`
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = reject
		image.src = src
	})
}
