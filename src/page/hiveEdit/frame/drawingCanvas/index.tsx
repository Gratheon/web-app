import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import T from '@/shared/translate';
import { selectImageUrlForRequiredSize } from '@/shared/imageResizes';
import { layerToggleButtonStyle, MED_ZOOM } from './constants';
import { type CanvasCameraState } from './canvasGeometry';
import { drawCanvasLayers, loadImage } from './drawCanvasLayers';
import CanvasControlTabs from './components/CanvasControlTabs';
import DetectionToolbar from './components/DetectionToolbar';
import FrameCellsToolbar from './components/FrameCellsToolbar';
import FreeDrawToolbar from './components/FreeDrawToolbar';
import QueenControlsPanel from './components/QueenControlsPanel';
import ReadOnlyLayerPanel from './components/ReadOnlyLayerPanel';
import type { CanvasControlTab, DrawingCanvasProps, ResizeLike } from './types';
import { useCanvasInteractions } from './useCanvasInteractions';
import { useCellBrush } from './useCellBrush';
import { useQueenAnnotations } from './useQueenAnnotations';

export type { DrawingCanvasProps } from './types';

const INITIAL_CANVAS_REQUIRED_DIMENSION_PX = 1024;

function getCanvasRequiredDimension(canvas: HTMLCanvasElement | null, zoom = 1) {
	if (!canvas) {
		return INITIAL_CANVAS_REQUIRED_DIMENSION_PX * zoom;
	}

	return Math.max(canvas.width, canvas.height, INITIAL_CANVAS_REQUIRED_DIMENSION_PX) * zoom;
}

function resolveCanvasImageUrl(
	imageUrl: string,
	resizes: ResizeLike[] = [],
	canvas: HTMLCanvasElement | null,
	zoom = 1
) {
	// WHY: frame originals can be several MB; low zoom does not need native-resolution pixels.
	// WHAT: use the smallest resize that covers visible canvas pixels and defer original until deep zoom.
	return selectImageUrlForRequiredSize({
		originalUrl: imageUrl,
		resizes,
		requiredDimensionPx: getCanvasRequiredDimension(canvas, zoom),
		allowOriginal: zoom > MED_ZOOM,
		allowOriginalWhenNoResizes: true,
		minimumResizeDimensionPx: 128,
	}) || imageUrl;
}

export default function DrawingCanvas({
	imageUrl,
	resizes = [],
	strokeHistory = [],
	detectedQueenCups = [],
	detectedBees = [],
	detectedDrones = [],
	detectedCells = [],
	detectedVarroa = [],
	queenAnnotations = [],
	families = [],
	currentFrameId,
	onStrokeHistoryUpdate,
	onDetectedCellsUpdate,
	onQueenAnnotationsUpdate,
	onRemoveDetectedQueenCandidate,
	onCreateQueen,
	frameSideFile,
	hideControls = false,
	allowDrawing = true,
	saveRequestId = 0,
	onCellEditsStateChange = () => {},
}: DrawingCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const cameraRef = useRef<CanvasCameraState>({ zoom: 1, offset: { x: 0, y: 0 } });
	const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
	const [showBees, setBeeVisibility] = useState(true);
	const [showDrones, setDroneVisibility] = useState(true);
	const [showQueenCups, setQueenCupsVisibility] = useState(true);
	const [showVarroa, setShowVarroaVisibility] = useState(true);
	const [showQueenAnnotations, setShowQueenAnnotations] = useState(true);
	const [isAiQueenVisible, setIsAiQueenVisible] = useState(true);
	const [showFrameCells, setShowFrameCells] = useState(false);
	const [activeControlTab, setActiveControlTab] = useState<CanvasControlTab>('frame-cells');
	const [activeTool, setActiveTool] = useState<'cell-brush' | 'stroke'>('cell-brush');
	const initialCanvasUrl = useMemo(
		() => resolveCanvasImageUrl(imageUrl, resizes, null, 1),
		[imageUrl, resizes]
	);
	const [canvasUrl, setCanvasUrl] = useState(initialCanvasUrl);
	const resolveCanvasUrlForZoom = useCallback(
		(zoom: number) => resolveCanvasImageUrl(imageUrl, resizes, canvasRef.current, zoom),
		[imageUrl, resizes]
	);

	const {
		selectedCellType,
		setSelectedCellType,
		brushSizePreset,
		setBrushSizePreset,
		cellsOpacityPercent,
		setCellsOpacityPercent,
		brushRadiusRatio,
		increaseBrushPreset,
		decreaseBrushPreset,
		hasUnsavedCellEdits,
		isSavingCellEdits,
		editableDetectedCellsRef,
		brushCursorRef,
		lastBrushCenterRef,
		clearBrushInteractionState,
		applyBrushAtPoint,
	} = useCellBrush({
		detectedCells,
		onDetectedCellsUpdate,
		saveRequestId,
		onCellEditsStateChange,
	});

	const {
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
		pendingMarkerFamilyId,
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
		handleAssignFamily,
		removeQueenAnnotation,
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
	} = useQueenAnnotations({
		queenAnnotations,
		families,
		currentFrameId,
		frameSideFile,
		onQueenAnnotationsUpdate,
		onRemoveDetectedQueenCandidate,
		onCreateQueen,
	});

	const allDetectedBees = useMemo(() => {
		const combined = [...(detectedBees || [])];
		if (detectedDrones && detectedDrones.length > 0) {
			combined.push(...detectedDrones);
		}
		return combined;
	}, [detectedBees, detectedDrones]);

	const readOnlyQueenMarkers = useMemo(
		() => editableQueenAnnotations || [],
		[editableQueenAnnotations]
	);
	const queenAnnotationsOnCanvas = (allowDrawing ? editableQueenAnnotations : readOnlyQueenMarkers)
		.filter((annotation) => (
			isAiQueenVisible || !(annotation?.source === 'ai' && annotation?.status !== 'approved')
		));
	const showAiQueensOnCanvas = false;
	const canCellBrush = allowDrawing && activeControlTab === 'frame-cells';
	const canStrokeDraw = allowDrawing && activeControlTab === 'free-draw';
	const showQueenCupsOnCanvas = allowDrawing ? showQueenCups : false;
	const showVarroaOnCanvas = showVarroa;
	const showDetectedCellsOnCanvas = allowDrawing ? true : showFrameCells;
	const cellsOpacityFactor = cellsOpacityPercent / 100;

	const undoDraw = useCallback(() => {
		if (!allowDrawing) return;
		const newHistory = [...strokeHistory];
		newHistory.pop();
		onStrokeHistoryUpdate(newHistory);
	}, [allowDrawing, onStrokeHistoryUpdate, strokeHistory]);

	const clearHistory = useCallback(() => {
		if (!allowDrawing) return;
		onStrokeHistoryUpdate([]);
	}, [allowDrawing, onStrokeHistoryUpdate]);

	const redrawCurrentCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.setTransform(
			cameraRef.current.zoom,
			0,
			0,
			cameraRef.current.zoom,
			cameraRef.current.offset.x,
			cameraRef.current.offset.y,
		);
		drawCanvasLayers({
			canvas,
			ctx,
			image: loadedImage,
			strokeHistory,
			showDetectedCells: showDetectedCellsOnCanvas,
			showBees,
			showDrones,
			isAiQueenVisible: showAiQueensOnCanvas,
			detectedBees: allDetectedBees,
			detectedCells: editableDetectedCellsRef.current,
			showQueenCups: showQueenCupsOnCanvas,
			detectedQueenCups,
			showVarroa: showVarroaOnCanvas,
			detectedVarroa,
			showQueenAnnotations,
			queenAnnotations: queenAnnotationsOnCanvas,
			familyNameById,
			brushCursor: brushCursorRef.current,
			isAddingQueenMarker,
			canCellBrushPreview: canCellBrush,
			activeTool,
			selectedCellType,
			brushRadiusRatio,
			cellsOpacityFactor,
		});
	}, [
		activeTool,
		allDetectedBees,
		brushRadiusRatio,
		canCellBrush,
		cellsOpacityFactor,
		detectedQueenCups,
		detectedVarroa,
		editableDetectedCellsRef,
		familyNameById,
		isAddingQueenMarker,
		loadedImage,
		queenAnnotationsOnCanvas,
		selectedCellType,
		showAiQueensOnCanvas,
		showBees,
		showDetectedCellsOnCanvas,
		showDrones,
		showQueenAnnotations,
		showQueenCupsOnCanvas,
		showVarroaOnCanvas,
		strokeHistory,
	]);

	const { scheduleRedraw, resetStrokeDraft } = useCanvasInteractions({
		cameraRef,
		canvasRef,
		image: loadedImage,
		canvasUrl,
		setCanvasUrl,
		getCanvasUrlForZoom: resolveCanvasUrlForZoom,
		allowDrawing,
		activeControlTab,
		activeTool,
		strokeHistory,
		onStrokeHistoryUpdate,
		redrawCurrentCanvas,
		canCellBrush,
		canStrokeDraw,
		selectedCellType,
		brushRadiusRatio,
		setActiveControlTab,
		setSelectedCellType,
		increaseBrushPreset,
		decreaseBrushPreset,
		undoDraw,
		editableDetectedCellsRef,
		brushCursorRef,
		lastBrushCenterRef,
		applyBrushAtPoint,
		clearBrushInteractionState,
		queenAnnotationsOnCanvas,
		editableQueenAnnotationsRef,
		setEditableQueenAnnotations,
		isAddingQueenMarker,
		addQueenMarkerAtPosition,
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
		commitTransientAnnotationChange,
		resetMarkerInteractionState,
	});

	useEffect(() => {
		scheduleRedraw();
	}, [detectedCells, scheduleRedraw]);

	const previousImageUrlRef = useRef(imageUrl);

	useEffect(() => {
		if (previousImageUrlRef.current === imageUrl) {
			return;
		}

		previousImageUrlRef.current = imageUrl;
		// WHY: switching to another frame side must drop the previous bitmap immediately.
		// WHAT: reset only when the original source image changes, not when resize metadata refreshes.
		setLoadedImage(null);
		setCanvasUrl(initialCanvasUrl);
	}, [imageUrl, initialCanvasUrl]);

	useEffect(() => {
		const nextCanvasUrl = resolveCanvasUrlForZoom(cameraRef.current.zoom || 1);
		if (nextCanvasUrl && nextCanvasUrl !== canvasUrl) {
			setCanvasUrl(nextCanvasUrl);
		}
	}, [canvasUrl, resolveCanvasUrlForZoom]);

	useEffect(() => {
		let isActive = true;
		loadImage(canvasUrl)
			.then((loadedImg) => {
				if (!isActive) return;
				setLoadedImage(loadedImg);
			})
			.catch(console.error);
		return () => {
			isActive = false;
		};
	}, [canvasUrl]);

	useEffect(() => {
		redrawCurrentCanvas();
	}, [
		showBees,
		showDrones,
		isAiQueenVisible,
		showQueenCups,
		showVarroa,
		showQueenAnnotations,
		redrawCurrentCanvas,
	]);

	useEffect(() => {
		redrawCurrentCanvas();
	}, [
		detectedBees,
		detectedCells,
		detectedQueenCups,
		detectedVarroa,
		editableQueenAnnotations,
		redrawCurrentCanvas,
	]);

	useEffect(() => {
		if (!allowDrawing) return;
		if (activeControlTab === 'frame-cells') {
			setActiveTool('cell-brush');
		} else if (activeControlTab === 'free-draw') {
			setActiveTool('stroke');
		}
		if (activeControlTab !== 'frame-cells') {
			clearBrushInteractionState();
			scheduleRedraw();
		}
	}, [activeControlTab, allowDrawing, clearBrushInteractionState, scheduleRedraw]);

	useEffect(() => {
		return () => {
			resetStrokeDraft();
		};
	}, [resetStrokeDraft]);

	const isAnyDetectionLoading =
		!(
			frameSideFile?.isBeeDetectionComplete ||
			frameSideFile?.isDroneDetectionComplete ||
			(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
			(frameSideFile?.detectedDroneCount || 0) > 0 ||
			(detectedBees?.length || 0) > 0 ||
			(detectedDrones?.length || 0) > 0
		) ||
		!frameSideFile?.isCellsDetectionComplete ||
		!frameSideFile?.isQueenCupsDetectionComplete ||
		!frameSideFile?.isQueenDetectionComplete;

	useEffect(() => {
		console.debug('[DrawingCanvas] detection flags', {
			frameSideId: frameSideFile?.frameSideId,
			isBeeDetectionComplete: frameSideFile?.isBeeDetectionComplete,
			isDroneDetectionComplete: frameSideFile?.isDroneDetectionComplete,
			isCellsDetectionComplete: frameSideFile?.isCellsDetectionComplete,
			isQueenCupsDetectionComplete: frameSideFile?.isQueenCupsDetectionComplete,
			isQueenDetectionComplete: frameSideFile?.isQueenDetectionComplete,
			detectedWorkerBeeCount: frameSideFile?.detectedWorkerBeeCount,
			detectedDroneCount: frameSideFile?.detectedDroneCount,
			detectedQueenCount: frameSideFile?.detectedQueenCount,
			isAnyDetectionLoading,
		});
	}, [frameSideFile, isAnyDetectionLoading]);

	if (!imageUrl) {
		return <div><T>Loading image...</T></div>;
	}

	return (
		<div style={{ position: 'relative', overflow: 'hidden' }}>
			{!hideControls && allowDrawing && (
				<CanvasControlTabs activeControlTab={activeControlTab} onSelect={setActiveControlTab} />
			)}

			{!hideControls && !allowDrawing && (
				<ReadOnlyLayerPanel
					frameSideFile={frameSideFile}
					detectedBees={detectedBees}
					detectedDrones={detectedDrones}
					detectedVarroa={detectedVarroa}
					showFrameCells={showFrameCells}
					setShowFrameCells={setShowFrameCells}
					showBees={showBees}
					setBeeVisibility={setBeeVisibility}
					showDrones={showDrones}
					setDroneVisibility={setDroneVisibility}
					showQueenAnnotations={showQueenAnnotations}
					setShowQueenAnnotations={setShowQueenAnnotations}
					readOnlyQueenMarkersCount={readOnlyQueenMarkers.length}
					showVarroa={showVarroa}
					setShowVarroaVisibility={setShowVarroaVisibility}
					layerToggleButtonStyle={layerToggleButtonStyle}
				/>
			)}

			{!hideControls && allowDrawing && (activeControlTab === 'bees' || activeControlTab === 'varroa-mites') && (
				<DetectionToolbar
					activeControlTab={activeControlTab}
					frameSideFile={frameSideFile}
					detectedBees={detectedBees}
					detectedDrones={detectedDrones}
					detectedVarroa={detectedVarroa}
					showBees={showBees}
					setBeeVisibility={setBeeVisibility}
					showDrones={showDrones}
					setDroneVisibility={setDroneVisibility}
					showVarroa={showVarroa}
					setShowVarroaVisibility={setShowVarroaVisibility}
					layerToggleButtonStyle={layerToggleButtonStyle}
				/>
			)}

			{!hideControls && allowDrawing && activeControlTab === 'frame-cells' && (
				<FrameCellsToolbar
					brushSizePreset={brushSizePreset}
					onSetBrushSizePreset={setBrushSizePreset}
					selectedCellType={selectedCellType}
					onSetSelectedCellType={setSelectedCellType}
					cellsOpacityPercent={cellsOpacityPercent}
					onSetCellsOpacityPercent={setCellsOpacityPercent}
				/>
			)}

			{!hideControls && allowDrawing && activeControlTab === 'free-draw' && (
				<FreeDrawToolbar onUndo={undoDraw} onClear={clearHistory} />
			)}

			{allowDrawing && onQueenAnnotationsUpdate && activeControlTab === 'queens' && (
				<QueenControlsPanel
					frameSideFile={frameSideFile}
					detectedQueenCups={detectedQueenCups}
					showQueenAnnotations={showQueenAnnotations}
					setShowQueenAnnotations={setShowQueenAnnotations}
					isAiQueenVisible={isAiQueenVisible}
					setIsAiQueenVisible={setIsAiQueenVisible}
					showQueenCups={showQueenCups}
					setQueenCupsVisibility={setQueenCupsVisibility}
					isAddingQueenMarker={isAddingQueenMarker}
					pendingMarkerFamilyId={pendingMarkerFamilyId}
					onStartMarkExistingQueen={onStartMarkExistingQueen}
					onOpenMarkNewQueenModal={onOpenMarkNewQueenModal}
					editableQueenAnnotations={editableQueenAnnotations}
					families={families}
					familyById={familyById}
					occupiedFamilyIds={occupiedFamilyIds}
					handleAssignFamily={handleAssignFamily}
					removeQueenAnnotation={removeQueenAnnotation}
					approveAiCandidate={approveAiCandidate}
					rejectAiCandidate={rejectAiCandidate}
					isCreateQueenModalOpen={isCreateQueenModalOpen}
					setIsCreateQueenModalOpen={setIsCreateQueenModalOpen}
					newQueenName={newQueenName}
					setNewQueenName={setNewQueenName}
					newQueenRace={newQueenRace}
					setNewQueenRace={setNewQueenRace}
					newQueenYear={newQueenYear}
					setNewQueenYear={setNewQueenYear}
					newQueenColor={newQueenColor}
					setNewQueenColor={setNewQueenColor}
					newQueenParentId={newQueenParentId}
					setNewQueenParentId={setNewQueenParentId}
					randomNameLoading={randomNameLoading}
					onRefreshQueenName={onRefreshQueenName}
					onConfirmCreateQueen={onConfirmCreateQueen}
					isCreatingQueen={isCreatingQueen}
					layerToggleButtonStyle={layerToggleButtonStyle}
				/>
			)}

			<canvas ref={canvasRef} id="container" style={{ width: '100%', display: 'block', touchAction: 'none' }}>
				<T>Canvas not supported.</T>
			</canvas>
		</div>
	);
}
