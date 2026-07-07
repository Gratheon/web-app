import Button from '../../../shared/button'
import T from '../../../shared/translate'
import HiveIcon from '../../../icons/hive.tsx'
import Link from '../../../shared/link'
import ListIcon from '../../../icons/listIcon.tsx'
import TableIcon from '../../../icons/tableIcon.tsx'
import StaticTreeIcon from '../../../icons/staticTreeIcon.tsx'
import MobileTruckIcon from '../../../icons/mobileTruckIcon.tsx'

import styles from './index.module.less'

export default function ApiaryListRowHeader({
	apiary,
	apiaryHives,
	effectiveListType,
	isMobileApiary,
	isMobileLayout,
	onListTypeChange,
}) {
	return (
		<div className={styles.apiaryHead}>
			<h2>
				<span
					className={styles.apiaryTypeIcon}
					title={isMobileApiary ? 'Mobile apiary' : 'Static apiary'}
				>
					{isMobileApiary ? <MobileTruckIcon /> : <StaticTreeIcon />}
				</span>
				<Link href={`/apiaries/${apiary.id}`}>
					{apiary.name ? apiary.name : '...'}
				</Link>
			</h2>

			<div className={styles.buttons}>
				{!isMobileLayout &&
					effectiveListType == 'table' &&
					apiaryHives.length > 0 && (
						<Button
							className={styles.viewModeToggle}
							onClick={() => onListTypeChange('list')}
						>
							<ListIcon />
						</Button>
					)}

				{!isMobileLayout &&
					effectiveListType == 'list' &&
					apiaryHives.length > 0 && (
						<Button
							className={styles.viewModeToggle}
							onClick={() => onListTypeChange('table')}
						>
							<TableIcon />
						</Button>
					)}

				<Button
					href={`/apiaries/${apiary.id}/hives/add`}
					color={apiaryHives.length == 0 ? 'green' : 'white'}
					className={styles.addHiveButton}
				>
					<HiveIcon />
					<span className={styles.addHiveButtonLabel}>
						<T ctx="button to add beehive">Add hive</T>
					</span>
				</Button>
			</div>
		</div>
	)
}
