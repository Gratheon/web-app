import React, { useMemo, useRef, useState, useEffect } from 'react';
import style from './style.module.less';
import beeURL from "@/assets/bee-side.png"
import { gql, useMutation, useQuery } from '@/api';
import {
	normalizeGateHoleCount,
	updateBox,
	getBox,
	GATE_HOLE_COUNT_MAX,
	GATE_HOLE_COUNT_MIN,
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

const UPDATE_BOX_HOLE_COUNT_MUTATION = gql`
mutation updateBoxHoleCount($id: ID!, $holeCount: Int!) {
	updateBoxHoleCount(id: $id, holeCount: $holeCount)
}
`

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
	const [updateBoxHoleCountMutation] = useMutation(UPDATE_BOX_HOLE_COUNT_MUTATION)
	const entranceRef = useRef<HTMLDivElement | null>(null)
	const dragStateRef = useRef<{ side: 'left' | 'right' } | null>(null)
	const [isDraggingDoor, setIsDraggingDoor] = useState(false)
	const [draftHoleCount, setDraftHoleCount] = useState(() => normalizeGateHoleCount(box?.holeCount))

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error.message}</p>;

	useEffect(() => {
		if (!isDraggingDoor) {
			setDraftHoleCount(normalizeGateHoleCount(box?.holeCount))
		}
	}, [box?.holeCount, isDraggingDoor])

	let beesIn = data?.entranceMovementToday?.beesIn;
	let beesOut = data?.entranceMovementToday?.beesOut;

	let indicatorIn = null;
	let indicatorOut = null;
	const holeCount = normalizeGateHoleCount(draftHoleCount)
	const halfSlots = GATE_HOLE_COUNT_MAX / 2
	const slotStepPercent = 25 / halfSlots
	const leftVisible = Math.floor(holeCount / 2)
	const rightVisible = holeCount - leftVisible
	const doorTravelLeftPercent = `${leftVisible * slotStepPercent}%`
	const doorTravelRightPercent = `${rightVisible * slotStepPercent}%`
	const holeGapPx = holeCount > 10 ? 2 : 3

	const persistHoleCount = async (nextCount: number) => {
		const normalized = normalizeGateHoleCount(nextCount)
		if (normalized === normalizeGateHoleCount(box?.holeCount)) return

		const result = await updateBoxHoleCountMutation({
			id: `${box.id}`,
			holeCount: normalized,
		})
		if (result?.error) return

		const latestBox = await getBox(+box.id)
		await updateBox({
			id: +box.id,
			hiveId: latestBox?.hiveId ? +latestBox.hiveId : +hiveId,
			position: latestBox?.position ? +latestBox.position : +box.position,
			type: box.type,
			color: latestBox?.color ?? box.color,
			holeCount: normalized,
		})
	}

	const updateDraftFromPointer = (event: PointerEvent) => {
		const root = entranceRef.current
		const dragState = dragStateRef.current
		if (!root || !dragState) return null

		const rect = root.getBoundingClientRect()
		const centerX = rect.left + rect.width / 2
		const halfOpenRange = rect.width * 0.25
		if (halfOpenRange <= 0) return null

		const signedDistance = dragState.side === 'left'
			? centerX - event.clientX
			: event.clientX - centerX

		const clamped = Math.max(0, Math.min(halfOpenRange, signedDistance))
		const fraction = clamped / halfOpenRange
		const nextCount = Math.round(fraction * GATE_HOLE_COUNT_MAX)
		const normalized = Math.max(GATE_HOLE_COUNT_MIN, Math.min(GATE_HOLE_COUNT_MAX, nextCount))
		setDraftHoleCount(normalized)
		return normalized
	}

	const beginDoorDrag = (side: 'left' | 'right', event: any) => {
		event.preventDefault()
		event.stopPropagation()
		dragStateRef.current = {
			side,
		}
		setIsDraggingDoor(true)

		const onMove = (moveEvent: PointerEvent) => {
			updateDraftFromPointer(moveEvent)
		}
		const onUp = async (upEvent: PointerEvent) => {
			const finalCount = updateDraftFromPointer(upEvent)
			window.removeEventListener('pointermove', onMove)
			window.removeEventListener('pointerup', onUp)
			setIsDraggingDoor(false)
			dragStateRef.current = null
			if (finalCount !== null) {
				await persistHoleCount(normalizeGateHoleCount(finalCount))
			}
		}

		window.addEventListener('pointermove', onMove)
		window.addEventListener('pointerup', onUp)
	}

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
				ref={entranceRef}
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
				<div
					className={`${style.entranceDoor} ${style.entranceDoorLeft} ${isDraggingDoor ? style.dragging : ''}`}
					onPointerDown={(event: any) => beginDoorDrag('left', event)}
				></div>
				<div
					className={`${style.entranceDoor} ${style.entranceDoorRight} ${isDraggingDoor ? style.dragging : ''}`}
					onPointerDown={(event: any) => beginDoorDrag('right', event)}
				></div>
			</div>
		</div>
	);
}
