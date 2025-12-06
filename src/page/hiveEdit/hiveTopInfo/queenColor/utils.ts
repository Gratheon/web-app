export function getQueenColorFromYear(year: string | number): string {
	if (!year) {
		return '#fefee3'
	}

	const yearInt = typeof year === 'string' ? parseInt(year) : year
	const colorRemainder = (yearInt - 2011) % 5

	switch (colorRemainder) {
		case 0:
			return '#fefee3'
		case 1:
			return '#ffba08'
		case 2:
			return '#f94144'
		case 3:
			return '#38b000'
		case 4:
			return '#0466c8'
		default:
			return '#fefee3'
	}
}

