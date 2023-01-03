import React from 'react'
import Loader from '../../../../../shared/loader'

export default function ImgLoading({ src, style }) {
	if (!src) {
		return <></>
	}

	if (typeof document === 'undefined') {
		return
	}

	const [show, setShow] = React.useState(false)

	React.useEffect(() => {
		const image = document.createElement('img')
		image.src = src
		image.onload = () => {
			setShow(true)
		}
	}, [])

	if (!show) {
		return <Loader />
	}

	return (
		<>
			<img src={src} alt="" style={show ? style : { display: 'none' }} />
		</>
	)
}
