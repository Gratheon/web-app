export function stripWarehouseSuffix(label?: string | null) {
	const text = String(label || '').trim()
	if (!text) return ''
	return text.replace(/\s*\((super|deep|horizontal)\)\s*$/i, '').trim()
}
