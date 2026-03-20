import React, { useState, useEffect } from 'react';
import style from './style.module.less';
import beeURL from "@/assets/bee-side.png"
import { gql, useQuery } from '@/api';
import {
	normalizeGateHoleCount,
	GATE_HOLE_COUNT_MAX,
} from '@/models/boxes';

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
	const holeCount = normalizeGateHoleCount(box?.holeCount)
	const halfSlots = GATE_HOLE_COUNT_MAX / 2
	const slotStepPercent = 25 / halfSlots
	const leftVisible = Math.floor(holeCount / 2)
	const rightVisible = holeCount - leftVisible
	const doorTravelLeftPercent = `${leftVisible * slotStepPercent}%`
	const doorTravelRightPercent = `${rightVisible * slotStepPercent}%`
	const holeGapPx = holeCount > 10 ? 2 : 3

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
			<Bee key={1} position={40 + Math.random() * 10} intervalMs={4000 + (Math.random() * 3000)} />
			<Bee key={2} position={40 + Math.random() * 10} intervalMs={3000 + (Math.random() * 3000)} />
			<Bee key={3} position={40 + Math.random() * 10} intervalMs={4000 + (Math.random() * 3000)} />
			<Bee key={4} position={40 + Math.random() * 10} intervalMs={5000 + (Math.random() * 3000)} />

			<div style="color:white;font-size:12px;font-weight:bold;margin-bottom:10px;">
				{indicatorOut} {beesOut}
			</div>
			<div
				className={style.entranceViewport}
				style={{
					'--door-travel-left': doorTravelLeftPercent,
					'--door-travel-right': doorTravelRightPercent,
					'--hole-count': `${GATE_HOLE_COUNT_MAX}`,
					'--hole-gap': `${holeGapPx}px`,
				} as any}
			>
				<div className={style.entranceBase}></div>
				<div className={style.entranceHoles}>
					{[...Array(GATE_HOLE_COUNT_MAX)].map((_, index) => (
						(() => {
							const isLeftSide = index < halfSlots
							const leftBoundary = halfSlots - leftVisible
							const rightBoundary = halfSlots + rightVisible
							const isVisible = isLeftSide
								? index >= leftBoundary
								: index < rightBoundary
							return (
						<span
							key={index}
							className={`${style.entranceHole} ${!isVisible ? style.entranceHoleHidden : ''}`}
							title={`Entrance hole ${index + 1}`}
						></span>
							)
						})()
					))}
				</div>
				<div className={`${style.entranceDoor} ${style.entranceDoorLeft}`}></div>
				<div className={`${style.entranceDoor} ${style.entranceDoorRight}`}></div>
			</div>
		</div>
	);
}
