import React, { useState, useEffect } from 'react';
import style from './style.less';

const Bee = ({ position, intervalMs = 3000 }) => {
	const [left, setLeft] = useState(position);

	useEffect(() => {
		const interval = setInterval(() => {
			const newPosition = Math.random() * 20 + 40;
			setLeft(newPosition);
		}, intervalMs);

		return () => {
			clearInterval(interval);
		};
	}, []);

	let classes = style.bee;

	if (Math.random() > 0.5) {
		classes += " " + style.flip
	}

	return (
		<img
			src="/assets/bee-side.png"
			style={`left: ${left}%;animation-duration:${intervalMs}ms`}
			className={classes}
		/>
	);
};

export default function Gate() {
	return (
		<div className={style.gate}>
			{[...Array(11)].map((_, index) => (
				<div key={index} style="border:1px solid darkgrey;width:12px;height:12px;background:black;margin-right:12px;border-radius:5px 5px 0 0;"></div>
			))}
			<Bee key={1} position={40 + Math.random() * 10} intervalMs={4000 + (Math.random() * 3000)} />
			<Bee key={2} position={40 + Math.random() * 10} intervalMs={3000 + (Math.random() * 3000)} />
			<Bee key={3} position={40 + Math.random() * 10} intervalMs={4000 + (Math.random() * 3000)} />
			<Bee key={4} position={40 + Math.random() * 10} intervalMs={5000 + (Math.random() * 3000)} />
		</div>
	);
}