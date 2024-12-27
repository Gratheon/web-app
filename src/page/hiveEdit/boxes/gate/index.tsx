import React, { useState, useEffect } from 'react';
import style from './style.module.less';
import beeURL from "@/assets/bee-side.png"
import { gql, useQuery } from '@/api';

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
			src={beeURL}
			style={`left: ${left}%;animation-duration:${intervalMs}ms`}
			className={classes}
		/>
	);
};

export default function Gate({ hiveId, box, boxId }) {
	let { data, error, loading } = useQuery(gql`
		query entranceMovementToday($hiveId: ID!, $boxId: ID!) {
			entranceMovementToday(hiveId: $hiveId, boxId: $boxId) {
				beesIn
				beesOut
			}
		}
	`, {
		variables: { hiveId, boxId: box.id },
	});

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error.message}</p>;

	let beesIn = data?.entranceMovementToday?.beesIn;
	let beesOut = data?.entranceMovementToday?.beesOut;

	let indicatorIn = null;
	let indicatorOut = null;

	if (beesIn > 0 && beesOut > 0) {
		indicatorIn = '▲';
		indicatorOut = '▼';

		if (beesIn > 1.2 * beesOut) {
			indicatorIn = '🔺';
		} else if (beesOut > 1.2 * beesIn) {
			indicatorOut = '🔻';
		} else if (beesIn > beesOut) {
			indicatorIn = <span style="color:green">▲</span>;
		} else if (beesOut > beesIn) {
			indicatorOut = <span style="color:green">▼</span>;
		}
	}

	return (
		<div className={`${style.gate} ${boxId === box.id && style.selected}`}>
			<div style="color:white;font-size:12px;font-weight:bold;margin-bottom:10px;">
				{beesIn} {indicatorIn}
			</div>

			{[...Array(8)].map((_, index) => (
				<div key={index} style="border:1px solid darkgrey;width:12px;height:12px;background:black;margin-right:12px;border-radius:5px 5px 0 0;"></div>
			))}
			<Bee key={1} position={40 + Math.random() * 10} intervalMs={4000 + (Math.random() * 3000)} />
			<Bee key={2} position={40 + Math.random() * 10} intervalMs={3000 + (Math.random() * 3000)} />
			<Bee key={3} position={40 + Math.random() * 10} intervalMs={4000 + (Math.random() * 3000)} />
			<Bee key={4} position={40 + Math.random() * 10} intervalMs={5000 + (Math.random() * 3000)} />

			<div style="color:white;font-size:12px;font-weight:bold;margin-bottom:10px;">
				{indicatorOut} {beesOut}
			</div>
		</div>
	);
}