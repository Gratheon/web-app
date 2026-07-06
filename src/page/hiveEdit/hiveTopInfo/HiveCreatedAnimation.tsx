import { useEffect, useRef, useState } from 'preact/hooks'

import beeSideUrl from '@/assets/bee-side.png'
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'

const HIVE_CREATED_ANIMATION_MS = 3000
const HIVE_CREATED_BEE_COUNT = 220
const HIVE_CREATED_CLICK_SPEEDUP_MS = 900

const hiveCreatedBeeSwarm = Array.from({ length: HIVE_CREATED_BEE_COUNT }).map(
	(_, i) => {
		const edge = i % 4
		const sideOffset = (i * 37) % 100
		const size = 10 + (i % 6)

		return {
			key: i,
			startXPercent: edge === 0 ? 2 : edge === 1 ? 98 : sideOffset,
			startYPercent: edge === 2 ? 2 : edge === 3 ? 98 : sideOffset,
			delay: (i % 44) * 24,
			duration: 2150 + (i % 18) * 38,
			turns: 1.45 + (i % 7) * 0.2,
			direction: i % 2 === 0 ? 1 : -1,
			finalScale: 0.08 + (i % 7) * 0.018,
			style: {
				['--size' as any]: `${size}px`,
			} as any,
		}
	}
)

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function useHiveCreatedAnimation(
	celebrateHiveCreated: boolean,
	hasFamily: boolean
) {
	const [showHiveCreatedAnimation, setShowHiveCreatedAnimation] =
		useState(false)
	const hasPlayedHiveCreatedAnimation = useRef(false)
	const hiveCreatedIconRef = useRef<HTMLElement | null>(null)
	const hiveCreatedBeeRefs = useRef<any[]>([])
	const hiveCreatedSpeedupRef = useRef(0)

	useEffect(() => {
		if (
			!celebrateHiveCreated ||
			!hasFamily ||
			hasPlayedHiveCreatedAnimation.current
		) {
			return
		}

		hasPlayedHiveCreatedAnimation.current = true

		if (
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
		) {
			return
		}

		setShowHiveCreatedAnimation(true)
		hiveCreatedSpeedupRef.current = 0

		let animationFrame = 0
		const startedAt = performance.now()

		const animate = (now: number) => {
			const elapsed = now - startedAt + hiveCreatedSpeedupRef.current
			const targetElement = hiveCreatedIconRef.current as HTMLElement | null
			const targetRect = targetElement?.getBoundingClientRect()
			const targetX = targetRect
				? targetRect.left + targetRect.width / 2
				: window.innerWidth / 2
			const targetY = targetRect
				? targetRect.top + targetRect.height / 2
				: window.innerHeight / 2
			const viewportWidth = window.innerWidth
			const viewportHeight = window.innerHeight

			hiveCreatedBeeSwarm.forEach((bee) => {
				const element = hiveCreatedBeeRefs.current[
					bee.key
				] as HTMLElement | null
				if (!element) return

				const progress = clamp01((elapsed - bee.delay) / bee.duration)
				const startX = (bee.startXPercent / 100) * viewportWidth
				const startY = (bee.startYPercent / 100) * viewportHeight
				const dx = startX - targetX
				const dy = startY - targetY
				const distance = Math.hypot(dx, dy)
				const startAngle = Math.atan2(dy, dx)
				const spiralAngle =
					startAngle + bee.direction * bee.turns * Math.PI * 2 * progress
				const radius = distance * (1 - progress)
				const x = targetX + Math.cos(spiralAngle) * radius
				const y = targetY + Math.sin(spiralAngle) * radius
				const scale = 1 - (1 - bee.finalScale) * Math.pow(progress, 1.15)
				const opacity =
					progress <= 0
						? 0
						: progress < 0.05
						? progress / 0.05
						: progress > 0.9
						? (1 - progress) / 0.1
						: 1

				element.style.opacity = String(Math.max(0, opacity))
				element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${
					spiralAngle + Math.PI / 2
				}rad) scale(${scale})`
			})

			if (elapsed < HIVE_CREATED_ANIMATION_MS) {
				animationFrame = requestAnimationFrame(animate)
				return
			}

			setShowHiveCreatedAnimation(false)
		}

		animationFrame = requestAnimationFrame(animate)
		const cleanupTimer = window.setTimeout(() => {
			cancelAnimationFrame(animationFrame)
			setShowHiveCreatedAnimation(false)
		}, HIVE_CREATED_ANIMATION_MS + 250)

		return () => {
			cancelAnimationFrame(animationFrame)
			window.clearTimeout(cleanupTimer)
		}
	}, [celebrateHiveCreated, hasFamily])

	function speedUpHiveCreatedAnimation() {
		hiveCreatedSpeedupRef.current += HIVE_CREATED_CLICK_SPEEDUP_MS
	}

	return {
		showHiveCreatedAnimation,
		hiveCreatedIconRef,
		hiveCreatedBeeRefs,
		speedUpHiveCreatedAnimation,
	}
}

export default function HiveCreatedAnimation({ visible, beeRefs, onSpeedUp }) {
	if (!visible) {
		return null
	}

	return (
		<div
			className={styles.hiveCreatedBeeLayer}
			aria-hidden="true"
			onPointerDown={onSpeedUp}
		>
			{hiveCreatedBeeSwarm.map((bee) => (
				<img
					key={bee.key}
					ref={(element) => {
						beeRefs.current[bee.key] = element
					}}
					src={beeSideUrl}
					className={styles.hiveCreatedBee}
					style={bee.style}
					alt=""
				/>
			))}
		</div>
	)
}
