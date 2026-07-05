import T from '@/shared/translate'
import InspectionIcon from '@/icons/inspection'
import Button from '@/shared/button'
import SkullIcon from '@/icons/SkullIcon'
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import VisualFormSubmit from '@/shared/visualForm/submit'
import { isCollapsed, isEditable, isMerged } from '@/models/hive'
import DeactivateButton from '@/page/hiveEdit/deleteButton'

const SplitIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="currentColor"
		style="margin-right: 4px"
	>
		<path
			d="M8 2L8 6M8 6L6 4M8 6L10 4M8 10L8 14M8 10L6 12M8 10L10 12M3 8L6 8M10 8L13 8"
			stroke="currentColor"
			fill="none"
			stroke-width="1.5"
			stroke-linecap="round"
		/>
	</svg>
)

const JoinIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="currentColor"
		style="margin-right: 4px"
	>
		<path
			d="M2 6L5 8L2 10M14 6L11 8L14 10M5 8L11 8"
			stroke="currentColor"
			fill="none"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
)

type HiveActionButtonsProps = {
	hive: any
	apiaryId: string | number
	hiveId: string | number
	editable: boolean
	creatingInspection: boolean
	variant?: 'mobile' | 'desktop'
	onCreateInspectionClick: () => void
	onEditClick: () => void
	onSplitClick: () => void
	onJoinClick: () => void
	onCollapseClick: () => void
}

export default function HiveActionButtons({
	hive,
	editable,
	creatingInspection,
	variant = 'mobile',
	onCreateInspectionClick,
	onEditClick,
	onSplitClick,
	onJoinClick,
	onCollapseClick,
}: HiveActionButtonsProps) {
	return (
		<div>
			<VisualFormSubmit>
				{isEditable(hive) && (
					<PopupButtonGroup>
						{!editable && (
							<Button
								loading={creatingInspection}
								onClick={onCreateInspectionClick}
								color="green"
							>
								<InspectionIcon />
								<T ctx="This is a button that adds new beehive inspection as a snapshot of current beehive state">
									Complete Inspection
								</T>
							</Button>
						)}
						{!editable && hive && !isCollapsed(hive) && (
							<Button onClick={onEditClick}>
								<T ctx="this is a button to allow editing by displaying a form">
									Edit
								</T>
							</Button>
						)}

						{!editable && (
							<PopupButton align="right">
								<Button title="Split colony" onClick={onSplitClick}>
									<SplitIcon />{' '}
									<T
										ctx={
											'An operation on a bee colony by separating it into two or more parts. This is done to prevent swarming, expand the apiary, or create nucleus colonies.'
										}
									>
										Split Colony
									</T>
								</Button>

								<Button title="Join colonies" onClick={onJoinClick}>
									{variant === 'desktop' ? (
										<>
											<JoinIcon /> <T>Join Colony</T>
										</>
									) : (
										<>
											<JoinIcon />{' '}
											<T
												ctx={
													'Joining two bee colonies involves physically combining two separate colonies into one. This is done to strengthen a weak colony, manage queen genetics, or consolidate resources.'
												}
											>
												Combine Colonies
											</T>
										</>
									)}
								</Button>

								{hive && !isCollapsed(hive) && (
									<Button onClick={onCollapseClick}>
										<SkullIcon size={16} />{' '}
										<T
											ctx={
												'Marking bee colony as dead due to varroa mite infestation or other unknown causes'
											}
										>
											Mark as Collapsed
										</T>
									</Button>
								)}
								<DeactivateButton hiveId={hive.id} />
							</PopupButton>
						)}
					</PopupButtonGroup>
				)}

				{!isEditable(hive) && (isCollapsed(hive) || isMerged(hive)) && (
					<DeactivateButton hiveId={hive.id} />
				)}
			</VisualFormSubmit>
		</div>
	)
}
