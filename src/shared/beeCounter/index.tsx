import T from "../translate"
import beeURL from '@/assets/bee-worker.png'

export default function BeeCounter({count}) {
	if (!count) {
		return
	}

	return (
		<div style="font-size:14px;text-align:center;">
			<img src={beeURL} alt="bee icon" style="width:16px;height:16px;display:inline;" /> {count}
		</div>
	)
}