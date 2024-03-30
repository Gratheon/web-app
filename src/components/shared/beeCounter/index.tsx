import T from "../translate"

export default function BeeCounter({count}) {
	if (!count) {
		return
	}

	return (
		<div style="font-size:14px;text-align:center;">
			<img src="/assets/bee-worker.png" alt="bee icon" style="width:16px;height:16px;display:inline;" /> {count}
		</div>
	)
}