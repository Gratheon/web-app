import Button from '@/shared/button';
import Loader from '@/shared/loader';
import Modal from '@/shared/modal';
import T from '@/shared/translate';
import Checkbox from '@/icons/checkbox.tsx';
import RefreshIcon from '@/icons/RefreshIcon';
import QueenIcon from '@/icons/queenIcon.tsx';
import QueenColorPicker from '@/shared/queenColorPicker';
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor';
import inputStyles from '@/shared/input/styles.module.less';
import styles from '../styles.module.less';
import type { DrawingCanvasFamily } from '../types';
import type { QueenAnnotation } from '@/models/frameSideFile';

type Props = {
	frameSideFile: any;
	detectedQueenCups?: any[];
	showQueenAnnotations: boolean;
	setShowQueenAnnotations: (value: boolean) => void;
	isAiQueenVisible: boolean;
	setIsAiQueenVisible: (value: boolean) => void;
	showQueenCups: boolean;
	setQueenCupsVisibility: (value: boolean) => void;
	isAddingQueenMarker: boolean;
	pendingMarkerFamilyId: number | null;
	onStartMarkExistingQueen: () => void;
	onOpenMarkNewQueenModal: () => void;
	editableQueenAnnotations: QueenAnnotation[];
	families: DrawingCanvasFamily[];
	familyById: Map<number, DrawingCanvasFamily>;
	occupiedFamilyIds: Set<number>;
	handleAssignFamily: (annotation: QueenAnnotation, value: string) => Promise<void>;
	removeQueenAnnotation: (annotation: QueenAnnotation) => Promise<void>;
	approveAiCandidate: (annotation: QueenAnnotation) => Promise<void>;
	rejectAiCandidate: (annotation: QueenAnnotation) => Promise<void>;
	isCreateQueenModalOpen: boolean;
	setIsCreateQueenModalOpen: (value: boolean) => void;
	newQueenName: string;
	setNewQueenName: (value: string) => void;
	newQueenRace: string;
	setNewQueenRace: (value: string) => void;
	newQueenYear: string;
	setNewQueenYear: (value: string) => void;
	newQueenColor: string | null;
	setNewQueenColor: (value: string | null) => void;
	newQueenParentId: string;
	setNewQueenParentId: (value: string) => void;
	randomNameLoading: boolean;
	onRefreshQueenName: () => void;
	onConfirmCreateQueen: () => Promise<void>;
	isCreatingQueen: boolean;
	layerToggleButtonStyle: React.CSSProperties;
};

export default function QueenControlsPanel({
	frameSideFile,
	detectedQueenCups = [],
	showQueenAnnotations,
	setShowQueenAnnotations,
	isAiQueenVisible,
	setIsAiQueenVisible,
	showQueenCups,
	setQueenCupsVisibility,
	isAddingQueenMarker,
	pendingMarkerFamilyId,
	onStartMarkExistingQueen,
	onOpenMarkNewQueenModal,
	editableQueenAnnotations,
	families,
	familyById,
	occupiedFamilyIds,
	handleAssignFamily,
	removeQueenAnnotation,
	approveAiCandidate,
	rejectAiCandidate,
	isCreateQueenModalOpen,
	setIsCreateQueenModalOpen,
	newQueenName,
	setNewQueenName,
	newQueenRace,
	setNewQueenRace,
	newQueenYear,
	setNewQueenYear,
	newQueenColor,
	setNewQueenColor,
	newQueenParentId,
	setNewQueenParentId,
	randomNameLoading,
	onRefreshQueenName,
	onConfirmCreateQueen,
	isCreatingQueen,
	layerToggleButtonStyle,
}: Props) {
	return (
		<>
			<div style={{ marginTop: 10, border: '1px solid #d5dbe5', borderRadius: 8, padding: 10, background: '#f8fbff' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowQueenAnnotations(!showQueenAnnotations)}>
							<Checkbox on={showQueenAnnotations} color="#111" />
							<span><T>Queen markers</T></span>
						</Button>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setIsAiQueenVisible(!isAiQueenVisible)}>
							{frameSideFile?.isQueenDetectionComplete ? <Checkbox on={isAiQueenVisible} color="#111" /> : <Loader size={0} stroke="#111" />}
							<span><T ctx="toggle AI queen visibility">AI queen candidates</T></span>
							<QueenIcon size={14} color={'#111'} />
						</Button>
						{detectedQueenCups && (
							<Button size="small" style={layerToggleButtonStyle} onClick={() => setQueenCupsVisibility(!showQueenCups)}>
								{frameSideFile?.isQueenCupsDetectionComplete ? <Checkbox on={showQueenCups} color="#111" /> : <Loader size={0} stroke="#111" />}
								<span><T ctx="toggle queen cups visibility">Queen cups</T></span>
							</Button>
						)}
					</div>
					<div style={{ display: 'flex', gap: 6 }}>
						<Button
							size="small"
							onClick={onStartMarkExistingQueen}
							style={isAddingQueenMarker && pendingMarkerFamilyId === null ? { background: '#2470ff', color: '#fff' } : undefined}
						>
							<T>{isAddingQueenMarker && pendingMarkerFamilyId === null ? 'Click image to mark existing queen' : 'Mark existing queen'}</T>
						</Button>
						<Button
							size="small"
							onClick={onOpenMarkNewQueenModal}
							style={isAddingQueenMarker && pendingMarkerFamilyId !== null ? { background: '#2470ff', color: '#fff' } : undefined}
						>
							<T>{isAddingQueenMarker && pendingMarkerFamilyId !== null ? 'Click image to mark new queen' : 'Mark new queen'}</T>
						</Button>
					</div>
				</div>
				{editableQueenAnnotations.length === 0 && (
					<div style={{ fontSize: 13, color: '#415066' }}>
						<T>No queen markers on this frame yet.</T>
					</div>
				)}
				<div className={styles.queenMarkersGrid}>
					{editableQueenAnnotations.map((annotation) => {
						const isAiCandidate = annotation.source === 'ai' && annotation.status !== 'approved';
						const selectedFamilyId = Number(annotation.familyId);
						const selectedFamily = Number.isFinite(selectedFamilyId) && selectedFamilyId > 0
							? familyById.get(selectedFamilyId)
							: undefined;
						const selectableFamilies = (families || []).filter((family) => {
							const familyId = Number(family?.id);
							if (!Number.isFinite(familyId) || familyId <= 0) return false;
							if (Number.isFinite(selectedFamilyId) && selectedFamilyId > 0 && familyId === selectedFamilyId) return true;
							return !occupiedFamilyIds.has(familyId);
						});
						return (
							<div key={annotation.id} className={styles.queenMarkerCard}>
								<div className={styles.queenMarkerTopRow}>
									<div className={styles.queenFamilySelectWrap}>
										<span className={styles.queenFamilyColor}>
											{selectedFamily ? (
												<QueenColor year={selectedFamily.added || ''} color={selectedFamily.color} />
											) : (
												<span className={styles.queenFamilyColorPlaceholder} />
											)}
										</span>
										<select
											className={styles.queenFamilySelect}
											value={annotation.familyId ? String(annotation.familyId) : ''}
											onChange={(event) => void handleAssignFamily(annotation, String((event.target as HTMLSelectElement).value || ''))}
										>
											<option value="">Unassigned</option>
											{selectableFamilies.map((family) => (
												<option key={family.id} value={family.id}>
													{family.name || `#${family.id}`}
												</option>
											))}
										</select>
									</div>
									<Button size="small" color="red" onClick={async () => { await removeQueenAnnotation(annotation); }}>
										<T>Delete</T>
									</Button>
								</div>
								{isAiCandidate && (
									<div style={{ fontSize: 12, color: '#2f6dff' }}>
										<T>AI candidate</T>
									</div>
								)}
								{isAiCandidate && (
									<div className={styles.queenMarkerActionsRow}>
										<Button size="small" onClick={() => void approveAiCandidate(annotation)}>
											<T>Approve</T>
										</Button>
										<Button size="small" color="gray" onClick={() => void rejectAiCandidate(annotation)}>
											<T>Reject</T>
										</Button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{isCreateQueenModalOpen && (
				<Modal title={<T>New queen</T>} onClose={() => setIsCreateQueenModalOpen(false)}>
					<div className={styles.createQueenModalContent}>
						<div className={styles.createQueenNameRow}>
							<div style={{ flex: 1 }}>
								<label className={inputStyles.label}><T>Queen Name</T></label>
								<input
									className={inputStyles.input}
									type="text"
									value={newQueenName}
									onChange={(event) => setNewQueenName(String((event.target as HTMLInputElement).value || ''))}
									placeholder="Enter queen name"
									autoFocus
								/>
							</div>
							<Button
								type="button"
								onClick={onRefreshQueenName}
								disabled={randomNameLoading}
								style={{ height: '40px', minWidth: '40px', padding: '0 12px', margin: '24px 0 0' }}
								title="Get new name suggestion"
							>
								<RefreshIcon />
							</Button>
						</div>
						<div>
							<label className={inputStyles.label}><T>Race</T></label>
							<input
								className={inputStyles.input}
								type="text"
								value={newQueenRace}
								onChange={(event) => setNewQueenRace(String((event.target as HTMLInputElement).value || ''))}
								placeholder="e.g. Carniolan, Italian, etc."
							/>
						</div>
						<div>
							<label className={inputStyles.label}><T>Year</T></label>
							<div className={styles.createQueenYearRow}>
								<input
									className={inputStyles.input}
									type="text"
									value={newQueenYear}
									maxLength={4}
									onChange={(event) => {
										setNewQueenYear(String((event.target as HTMLInputElement).value || ''));
										setNewQueenColor(null);
									}}
									placeholder="YYYY"
								/>
								<div className={styles.createQueenColorPickerWrapper}>
									<QueenColorPicker
										year={newQueenYear}
										color={newQueenColor}
										onColorChange={(value: string) => setNewQueenColor(value)}
									/>
								</div>
							</div>
						</div>
						<div>
							<label className={inputStyles.label}><T>Parent queen</T></label>
							<select
								className={inputStyles.input}
								value={newQueenParentId}
								onChange={(event) => setNewQueenParentId(String((event.target as HTMLSelectElement).value || ''))}
							>
								<option value=""><T>Unknown / not set</T></option>
								{(families || []).map((family) => (
									<option key={String(family.id)} value={String(family.id)}>
										{family.name || `#${family.id}`}
									</option>
								))}
							</select>
						</div>
						<div className={styles.createQueenModalButtons}>
							<Button size="small" color="gray" onClick={() => setIsCreateQueenModalOpen(false)}>
								<T>Cancel</T>
							</Button>
							<Button size="small" color="green" onClick={() => void onConfirmCreateQueen()} loading={isCreatingQueen}>
								<T>Create and mark</T>
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
}
