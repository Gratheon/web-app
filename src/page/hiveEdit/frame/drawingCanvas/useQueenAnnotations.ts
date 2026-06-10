import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { gql, useQuery } from '@/api';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { getUser } from '@/models/user';
import type { QueenAnnotation } from '@/models/frameSideFile';
import { DEFAULT_QUEEN_MARKER_RADIUS_RATIO } from './constants';
import { buildOccupiedFamilyIds } from './queenAvailability';
import type { DrawingCanvasFamily } from './types';

const RANDOM_QUEEN_NAME_QUERY = gql`
	query RandomHiveName($language: String) {
		randomHiveName(language: $language)
	}
`;

type UseQueenAnnotationsParams = {
	queenAnnotations?: QueenAnnotation[];
	families?: DrawingCanvasFamily[];
	currentFrameId?: number;
	frameSideFile?: any;
	onQueenAnnotationsUpdate?: (queenAnnotations: QueenAnnotation[]) => void | Promise<void>;
	onRemoveDetectedQueenCandidate?: (target: { x: number; y: number }) => void | Promise<void>;
	onCreateQueen?: (queen: {
		name?: string;
		race?: string;
		added?: string;
		color?: string | null;
		parentId?: number | null;
	}) => Promise<number | null>;
};

export function useQueenAnnotations({
	queenAnnotations = [],
	families = [],
	currentFrameId,
	frameSideFile,
	onQueenAnnotationsUpdate,
	onRemoveDetectedQueenCandidate,
	onCreateQueen,
}: UseQueenAnnotationsParams) {
	const [editableQueenAnnotations, setEditableQueenAnnotations] = useState<QueenAnnotation[]>(queenAnnotations || []);
	const editableQueenAnnotationsRef = useRef<QueenAnnotation[]>(queenAnnotations || []);
	const queenResizeStateRef = useRef<{ annotationId: string; hasChanged: boolean } | null>(null);
	const queenMoveStateRef = useRef<{ annotationId: string; hasChanged: boolean; offsetX: number; offsetY: number } | null>(null);
	const [hoveredQueenResizeId, setHoveredQueenResizeId] = useState<string | null>(null);
	const [hoveredQueenMoveId, setHoveredQueenMoveId] = useState<string | null>(null);
	const [isQueenMarkerResizing, setIsQueenMarkerResizing] = useState(false);
	const [isQueenMarkerMoving, setIsQueenMarkerMoving] = useState(false);
	const [isAddingQueenMarker, setIsAddingQueenMarker] = useState(false);
	const [pendingMarkerFamilyId, setPendingMarkerFamilyId] = useState<number | null>(null);
	const [isCreateQueenModalOpen, setIsCreateQueenModalOpen] = useState(false);
	const [newQueenName, setNewQueenName] = useState('');
	const [newQueenRace, setNewQueenRace] = useState('');
	const [newQueenYear, setNewQueenYear] = useState(String(new Date().getFullYear()));
	const [newQueenColor, setNewQueenColor] = useState<string | null>(null);
	const [newQueenParentId, setNewQueenParentId] = useState('');
	const [isCreatingQueen, setIsCreatingQueen] = useState(false);
	const [nameSuggestionLang, setNameSuggestionLang] = useState('en');
	const user = useLiveQuery(() => getUser(), [], null);
	const {
		data: randomNameData,
		loading: randomNameLoading,
		reexecuteQuery: reexecuteRandomNameQuery,
	} = useQuery(RANDOM_QUEEN_NAME_QUERY, { variables: { language: nameSuggestionLang } });

	useEffect(() => {
		let lang = 'en';
		if (user?.lang) {
			lang = user.lang;
		} else if (user === null && typeof navigator !== 'undefined') {
			const browserLang = navigator.language.substring(0, 2) as any;
			if (SUPPORTED_LANGUAGES.includes(browserLang)) {
				lang = browserLang;
			}
		}
		setNameSuggestionLang(lang);
	}, [user]);

	useEffect(() => {
		if (randomNameData?.randomHiveName && !randomNameLoading) {
			setNewQueenName(String(randomNameData.randomHiveName || ''));
		}
	}, [randomNameData, randomNameLoading]);

	useEffect(() => {
		setEditableQueenAnnotations(Array.isArray(queenAnnotations) ? queenAnnotations : []);
	}, [queenAnnotations]);

	useEffect(() => {
		editableQueenAnnotationsRef.current = editableQueenAnnotations;
	}, [editableQueenAnnotations]);

	const persistQueenAnnotations = useCallback(async (nextAnnotations: QueenAnnotation[]) => {
		setEditableQueenAnnotations(nextAnnotations);
		editableQueenAnnotationsRef.current = nextAnnotations;
		if (onQueenAnnotationsUpdate) {
			await onQueenAnnotationsUpdate(nextAnnotations);
		}
	}, [onQueenAnnotationsUpdate]);

	const upsertQueenAnnotation = useCallback(async (
		id: string,
		updater: (annotation: QueenAnnotation) => QueenAnnotation
	) => {
		const next = editableQueenAnnotations.map((annotation) => (
			annotation.id === id ? updater(annotation) : annotation
		));
		await persistQueenAnnotations(next);
	}, [editableQueenAnnotations, persistQueenAnnotations]);

	const removeQueenAnnotation = useCallback(async (annotation: QueenAnnotation) => {
		const next = editableQueenAnnotations.filter((item) => item.id !== annotation.id);
		await persistQueenAnnotations(next);
	}, [editableQueenAnnotations, persistQueenAnnotations]);

	const handleAssignFamily = useCallback(async (annotation: QueenAnnotation, value: string) => {
		const familyId = value ? Number(value) : null;
		await upsertQueenAnnotation(annotation.id, (current) => ({
			...current,
			familyId,
			updatedAt: new Date().toISOString(),
		}));
	}, [upsertQueenAnnotation]);

	const approveAiCandidate = useCallback(async (annotation: QueenAnnotation) => {
		const selectedFamilyId = Number(annotation?.familyId);
		if (!Number.isFinite(selectedFamilyId) || selectedFamilyId <= 0) {
			window.alert('Select queen name before approving the AI candidate.');
			return;
		}

		const replacementMarker: QueenAnnotation = {
			id: `manual-${Date.now()}-${Math.round(Math.random() * 10000)}`,
			x: Number(annotation?.x) || 0.5,
			y: Number(annotation?.y) || 0.5,
			radius: Number(annotation?.radius) > 0 ? Number(annotation.radius) : DEFAULT_QUEEN_MARKER_RADIUS_RATIO,
			source: 'manual',
			status: 'approved',
			familyId: selectedFamilyId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const next = [
			...editableQueenAnnotations.filter((item) => item.id !== annotation.id),
			replacementMarker,
		];
		await persistQueenAnnotations(next);
	}, [editableQueenAnnotations, persistQueenAnnotations]);

	const onStartMarkExistingQueen = useCallback(() => {
		if (isAddingQueenMarker && pendingMarkerFamilyId === null) {
			setIsAddingQueenMarker(false);
			return;
		}
		setPendingMarkerFamilyId(null);
		setIsAddingQueenMarker(true);
	}, [isAddingQueenMarker, pendingMarkerFamilyId]);

	const onOpenMarkNewQueenModal = useCallback(() => {
		const suggestedName = String(randomNameData?.randomHiveName || '').trim();
		setNewQueenName(suggestedName);
		setNewQueenRace('');
		setNewQueenYear(String(new Date().getFullYear()));
		setNewQueenColor(null);
		const defaultParentId = Array.isArray(families) && families.length > 0
			? String(families[0]?.id || '')
			: '';
		setNewQueenParentId(defaultParentId);
		setIsCreateQueenModalOpen(true);
		if (!suggestedName) {
			reexecuteRandomNameQuery({ requestPolicy: 'network-only' });
		}
	}, [families, randomNameData, reexecuteRandomNameQuery]);

	const onRefreshQueenName = useCallback(() => {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' });
	}, [reexecuteRandomNameQuery]);

	const onConfirmCreateQueen = useCallback(async () => {
		const year = String(newQueenYear || '').trim();
		if (year && !/^\d{4}$/.test(year)) {
			window.alert('Year must be 4 digits (e.g. 2026).');
			return;
		}
		if (!onCreateQueen) {
			window.alert('Creating a queen is not available in this view.');
			return;
		}
		setIsCreatingQueen(true);
		try {
			const createdFamilyId = await onCreateQueen({
				name: newQueenName.trim() || undefined,
				race: newQueenRace.trim() || undefined,
				added: year || undefined,
				color: newQueenColor,
				parentId: newQueenParentId ? Number(newQueenParentId) : null,
			});
			if (!createdFamilyId) {
				window.alert('Failed to create queen.');
				return;
			}
			setPendingMarkerFamilyId(Number(createdFamilyId));
			setIsCreateQueenModalOpen(false);
			setIsAddingQueenMarker(true);
		} finally {
			setIsCreatingQueen(false);
		}
	}, [newQueenName, newQueenRace, newQueenYear, newQueenColor, newQueenParentId, onCreateQueen]);

	const addQueenMarkerAtPosition = useCallback(async (point: { x: number; y: number }) => {
		const newAnnotation: QueenAnnotation = {
			id: `manual-${Date.now()}-${Math.round(Math.random() * 10000)}`,
			x: point.x,
			y: point.y,
			radius: DEFAULT_QUEEN_MARKER_RADIUS_RATIO,
			source: 'manual',
			status: 'approved',
			familyId: pendingMarkerFamilyId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await persistQueenAnnotations([...(editableQueenAnnotationsRef.current || []), newAnnotation]);
		setIsAddingQueenMarker(false);
		setPendingMarkerFamilyId(null);
	}, [pendingMarkerFamilyId, persistQueenAnnotations]);

	const commitTransientAnnotationChange = useCallback(async (annotationId: string) => {
		const nowIso = new Date().toISOString();
		const nextAnnotations = editableQueenAnnotationsRef.current.map((annotation) => (
			annotation.id === annotationId
				? { ...annotation, updatedAt: nowIso }
				: annotation
		));
		// WHY: dragging/resizing should feel local and continuous, so we only persist once on pointer-up.
		// That preserves smooth interaction while keeping the stored marker timestamp aligned with the final shape.
		setEditableQueenAnnotations(nextAnnotations);
		editableQueenAnnotationsRef.current = nextAnnotations;
		if (onQueenAnnotationsUpdate) {
			await onQueenAnnotationsUpdate(nextAnnotations);
		}
	}, [onQueenAnnotationsUpdate]);

	const currentFrameSideId = Number(frameSideFile?.frameSideId);
	const familyNameById = useMemo(() => {
		const map: Record<number, string> = {};
		for (const family of families || []) {
			const numericId = Number(family?.id);
			if (!Number.isFinite(numericId)) continue;
			const name = String(family?.name || '').trim();
			if (name) map[numericId] = name;
		}
		return map;
	}, [families]);

	const familyById = useMemo(() => {
		const map = new Map<number, DrawingCanvasFamily>();
		for (const family of families || []) {
			const numericId = Number(family?.id);
			if (!Number.isFinite(numericId) || numericId <= 0) continue;
			map.set(numericId, family);
		}
		return map;
	}, [families]);

	const occupiedFamilyIds = useMemo(
		() => buildOccupiedFamilyIds({
			queenAnnotations: editableQueenAnnotations || [],
			families: families || [],
			currentFrameId,
			currentFrameSideId,
		}),
		[editableQueenAnnotations, families, currentFrameId, currentFrameSideId]
	);

	const rejectAiCandidate = useCallback(async (annotation: QueenAnnotation) => {
		if (annotation.source === 'ai' && onRemoveDetectedQueenCandidate) {
			await onRemoveDetectedQueenCandidate({ x: annotation.x, y: annotation.y });
		}
		await removeQueenAnnotation(annotation);
	}, [onRemoveDetectedQueenCandidate, removeQueenAnnotation]);

	const resetMarkerInteractionState = useCallback(() => {
		setHoveredQueenResizeId(null);
		setHoveredQueenMoveId(null);
		queenResizeStateRef.current = null;
		queenMoveStateRef.current = null;
		setIsQueenMarkerResizing(false);
		setIsQueenMarkerMoving(false);
	}, []);

	return {
		editableQueenAnnotations,
		setEditableQueenAnnotations,
		editableQueenAnnotationsRef,
		queenResizeStateRef,
		queenMoveStateRef,
		hoveredQueenResizeId,
		setHoveredQueenResizeId,
		hoveredQueenMoveId,
		setHoveredQueenMoveId,
		isQueenMarkerResizing,
		setIsQueenMarkerResizing,
		isQueenMarkerMoving,
		setIsQueenMarkerMoving,
		isAddingQueenMarker,
		setIsAddingQueenMarker,
		pendingMarkerFamilyId,
		setPendingMarkerFamilyId,
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
		isCreatingQueen,
		randomNameLoading,
		persistQueenAnnotations,
		removeQueenAnnotation,
		handleAssignFamily,
		approveAiCandidate,
		rejectAiCandidate,
		onStartMarkExistingQueen,
		onOpenMarkNewQueenModal,
		onRefreshQueenName,
		onConfirmCreateQueen,
		addQueenMarkerAtPosition,
		commitTransientAnnotationChange,
		familyNameById,
		familyById,
		occupiedFamilyIds,
		resetMarkerInteractionState,
	};
}
