import React, { useState } from 'react'

import colors from '@/colors'
import BellIcon from '@/icons/bell'
import CalendarIcon from '@/icons/calendar'
import HiveIcon from '@/icons/hive'
import PlusIcon from '@/icons/plusIcon'
import QueenIcon from '@/icons/queenIcon'
import ShareIcon from '@/icons/share'
import TrashIcon from '@/icons/trashIcon'
import WarnIcon from '@/icons/warn'
import BreadCrumbs from '@/shared/breadcrumbs'
import Button from '@/shared/button'
import Header from '@/shared/header'
import Input from '@/shared/input'
import Link from '@/shared/link'
import Loader from '@/shared/loader'
import MessageSuccess from '@/shared/messageSuccess'
import Modal from '@/shared/modal'
import Slider from '@/shared/slider'

import styles from './styles.module.less'

const brandColors = [
	{
		name: 'Company yellow / honey',
		value: colors.honeyColor,
		token: 'colors.honeyColor',
	},
	{ name: 'Company blue / queen', value: colors.queen, token: 'colors.queen' },
	{ name: 'Success green', value: '#2f8b0b', token: '@color-green' },
	{ name: 'Error red', value: '#cd311e', token: '@color-error-bg' },
	{ name: 'Warning purple', value: '#6200cd', token: '@color-warning-bg' },
	{ name: 'Hover gray', value: '#f3f3f3', token: '@color-hover-bg' },
]

const resourceColors = [
	{ name: 'Nectar', value: colors.nectarColor, token: 'colors.nectarColor' },
	{ name: 'Pollen', value: colors.pollenColor, token: 'colors.pollenColor' },
	{ name: 'Brood', value: colors.broodColor, token: 'colors.broodColor' },
	{ name: 'Eggs', value: colors.eggsColor, token: 'colors.eggsColor' },
	{
		name: 'Empty cells',
		value: colors.emptyCellColor,
		token: 'colors.emptyCellColor',
	},
	{
		name: 'Drone brood',
		value: colors.droneBroodColor,
		token: 'colors.droneBroodColor',
	},
]

const icons = [
	{ name: 'Hive', icon: <HiveIcon size={28} /> },
	{ name: 'Queen', icon: <QueenIcon size={28} /> },
	{
		name: 'Alert',
		icon: <BellIcon size={28} stroke="#424242" color="#f8f8f8" />,
	},
	{ name: 'Calendar', icon: <CalendarIcon size={28} /> },
	{ name: 'Share', icon: <ShareIcon size={28} /> },
	{ name: 'Warning', icon: <WarnIcon size={28} /> },
	{ name: 'Delete', icon: <TrashIcon size={28} /> },
]

function Section({ title, description, children }) {
	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<h2>{title}</h2>
				{description && <p>{description}</p>}
			</div>
			{children}
		</section>
	)
}

function ColorGrid({ colors: colorItems }) {
	return (
		<div className={styles.colorGrid}>
			{colorItems.map((color) => (
				<div className={styles.colorCard} key={color.token}>
					<div className={styles.swatch} style={{ background: color.value }} />
					<div>
						<strong>{color.name}</strong>
						<code>{color.token}</code>
						<span>{color.value}</span>
					</div>
				</div>
			))}
		</div>
	)
}

function ComponentPreview({ title, children }) {
	return (
		<div className={styles.previewCard}>
			<h3>{title}</h3>
			<div className={styles.previewBody}>{children}</div>
		</div>
	)
}

export default function DesignSystemPage() {
	const [sliderValue, setSliderValue] = useState(42)
	const [isModalOpen, setModalOpen] = useState(false)

	return (
		<div className={styles.page}>
			<Header
				loggedInHref="/design-system"
				loggedOutHref="/design-system"
				className={styles.header}
			/>

			<main className={styles.main}>
				<div className={styles.hero}>
					<div>
						<p className={styles.eyebrow}>Gratheon UI kit</p>
						<h1>Design System</h1>
						<p>
							A living reference for reusable React/Preact components, color
							tokens, icons, and basic interaction states used by the web app.
						</p>
					</div>
					<div className={styles.heroPanel}>
						<QueenIcon size={42} />
						<strong>Reusable first</strong>
						<span>
							Import from <code>@/shared</code>, <code>@/icons</code>, and{' '}
							<code>@/colors</code>.
						</span>
					</div>
				</div>

				<Section
					title="Foundations"
					description="Use these shared tokens before introducing a one-off color in page styles."
				>
					<h3 className={styles.subheading}>Brand and UI colors</h3>
					<ColorGrid colors={brandColors} />
					<h3 className={styles.subheading}>Hive resource colors</h3>
					<ColorGrid colors={resourceColors} />
				</Section>

				<Section
					title="Buttons"
					description="The shared Button component owns navigation, loading state, sizing, and color variants."
				>
					<div className={styles.previewGrid}>
						<ComponentPreview title="Color variants">
							<div className={styles.inlineWrap}>
								<Button>Default</Button>
								<Button color="green">Save hive</Button>
								<Button color="red">Delete</Button>
								<Button color="white">Cancel</Button>
								<Button disabled>Disabled</Button>
							</div>
						</ComponentPreview>
						<ComponentPreview title="Sizes and icons">
							<div className={styles.inlineWrap}>
								<Button size="small">
									<PlusIcon size={14} /> Small action
								</Button>
								<Button color="green">
									<HiveIcon size={16} /> Add hive
								</Button>
								<Button color="red" iconOnly title="Delete">
									<TrashIcon size={16} />
								</Button>
								<Button loading>Loading</Button>
							</div>
						</ComponentPreview>
					</div>
				</Section>

				<Section
					title="Forms"
					description="Shared inputs and sliders provide consistent labels, focus rings, and compact controls."
				>
					<div className={styles.previewGrid}>
						<ComponentPreview title="Inputs">
							<div className={styles.formExample}>
								<Input label="Apiary name" />
								<Input label="Hive count" type="number" value="12" />
							</div>
						</ComponentPreview>
						<ComponentPreview title="Slider">
							<div className={styles.sliderRow}>
								<Slider
									backgroundColor={colors.honeyColor}
									value={sliderValue}
									width={220}
									min={0}
									max={100}
									onChange={(event) =>
										setSliderValue(Number(event.currentTarget.value))
									}
								/>
								<span>{sliderValue}%</span>
							</div>
						</ComponentPreview>
					</div>
				</Section>

				<Section
					title="Feedback and overlays"
					description="Use shared feedback components so messages and modal behavior stay consistent."
				>
					<div className={styles.previewGrid}>
						<ComponentPreview title="Messages">
							<div className={styles.messageStack}>
								<MessageSuccess
									title="Saved"
									message="Hive settings were updated."
								/>
								<MessageSuccess
									isWarning
									title="Needs attention"
									message="Sensor data is delayed for this apiary."
								/>
							</div>
						</ComponentPreview>
						<ComponentPreview title="Modal and loader">
							<div className={styles.inlineWrap}>
								<Button onClick={() => setModalOpen(true)}>Open modal</Button>
								<div className={styles.loaderPreview}>
									<Loader size={1} />
								</div>
							</div>
						</ComponentPreview>
					</div>
				</Section>

				<Section
					title="Navigation"
					description="Breadcrumbs and links should use app routing helpers."
				>
					<ComponentPreview title="Breadcrumbs and links">
						<BreadCrumbs
							items={[
								{
									name: 'Apiaries',
									uri: '/apiaries',
									icon: <HiveIcon size={14} />,
								},
								{
									name: 'Design System',
									uri: '/design-system',
									icon: <QueenIcon size={14} />,
								},
							]}
						>
							<Link href="/apiaries">Back to app</Link>
						</BreadCrumbs>
					</ComponentPreview>
				</Section>

				<Section
					title="Icons"
					description="Icons live in src/icons and inherit current text color where possible."
				>
					<div className={styles.iconGrid}>
						{icons.map((item) => (
							<div className={styles.iconCard} key={item.name}>
								{item.icon}
								<span>{item.name}</span>
							</div>
						))}
					</div>
				</Section>
			</main>

			{isModalOpen && (
				<Modal title="Design system modal" onClose={() => setModalOpen(false)}>
					<div className={styles.modalExample}>
						<p>This modal is rendered with the shared Modal component.</p>
						<Button color="green" onClick={() => setModalOpen(false)}>
							Looks good
						</Button>
					</div>
				</Modal>
			)}
		</div>
	)
}
