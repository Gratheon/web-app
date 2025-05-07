import React, { useRef, useEffect, useState } from 'react';
import styles from './styles.module.less';
import Loader from '@/shared/loader';
import { useLiveQuery } from 'dexie-react-hooks';
import { getHives, bulkUpsertHives } from '../../models/hive';
import { listInspections } from '../../models/inspections';
import { useQuery, gql } from '../../api';

const HIVES_QUERY = gql`
  query HIVES {
    hives {
      id
      name
      notes
      familyId
      beeCount
      inspectionCount
      status
      collapse_date
      collapse_cause
    }
  }
`;

// Data declarations (once only)
const idealPopulationCurve = [
    { month: 0, value: 10000 },
    { month: 2, value: 15000 },
    { month: 5, value: 40000 },
    { month: 8, value: 35000 },
    { month: 11, value: 12000 }
];
const today = new Date();
const todayMonth = today.getMonth();
const todayDay = today.getDate();



function getMonthLabel(month: number) {
    return new Date(0, month).toLocaleString('default', { month: 'short' });
}

// --- Modular helpers for TimeView ---

function monthToX(month: number, view: { startMonth: number; monthsVisible: number }, canvasSize: { width: number; height: number }) {
    const { startMonth, monthsVisible } = view;
    return ((month - startMonth) / monthsVisible) * canvasSize.width;
}

function populationToY(pop: number, view: { minPop: number; maxPop: number }, canvasSize: { width: number; height: number }) {
    const { minPop, maxPop } = view;
    return canvasSize.height - ((pop - minPop) / (maxPop - minPop)) * canvasSize.height;
}

function drawYAxis(
    ctx: CanvasRenderingContext2D,
    view: { minPop: number; maxPop: number },
    canvasSize: { width: number; height: number },
    minPop: number,
    maxPop: number,
    populationToY: (pop: number, view: any, canvasSize: any) => number
) {
    ctx.save();
    ctx.strokeStyle = '#bbb';
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let pop = minPop; pop <= maxPop; pop += 10000) {
        const y = populationToY(pop, view, canvasSize);
        ctx.save();
        ctx.strokeStyle = '#eee';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        if (pop === maxPop) {
            ctx.textBaseline = 'top';
            ctx.fillText(pop.toLocaleString(), 38, y + 2);
        } else {
            ctx.textBaseline = 'middle';
            ctx.fillText(pop.toLocaleString(), 38, y);
        }
        ctx.restore();
    }
    ctx.save();
    ctx.translate(-16, canvasSize.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bee Population', 0, 0);
    ctx.restore();
    ctx.restore();
}

function drawXAxis(
    ctx: CanvasRenderingContext2D,
    view: { startMonth: number; monthsVisible: number },
    canvasSize: { width: number; height: number },
    monthToX: (month: number, view: any, canvasSize: any) => number,
    getMonthLabel: (month: number) => string
) {
    const { startMonth, monthsVisible } = view;
    const endMonth = startMonth + monthsVisible;
    for (let m = Math.floor(startMonth); m <= Math.ceil(endMonth); m++) {
        const x = monthToX(m, view, canvasSize);
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(x, canvasSize.height - 20);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        if (m === 0) {
            ctx.textAlign = 'left';
            ctx.fillText(getMonthLabel(m), x + 2, canvasSize.height - 2);
        } else {
            ctx.textAlign = 'center';
            ctx.fillText(getMonthLabel(m), x, canvasSize.height - 2);
        }
    }
}

function drawTodayLine(
    ctx: CanvasRenderingContext2D,
    todayMonth: number,
    view: { startMonth: number; monthsVisible: number },
    canvasSize: { width: number; height: number },
    monthToX: (month: number, view: any, canvasSize: any) => number
) {
    const { startMonth, monthsVisible } = view;
    const endMonth = startMonth + monthsVisible;
    if (todayMonth >= startMonth && todayMonth <= endMonth) {
        const x = monthToX(todayMonth, view, canvasSize);
        ctx.strokeStyle = '#ff0000';
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawIdealCurve(
    ctx: CanvasRenderingContext2D,
    showIdeal: boolean,
    idealPopulationCurve: { month: number; value: number }[],
    view: { startMonth: number; monthsVisible: number },
    canvasSize: { width: number; height: number },
    monthToX: (month: number, view: any, canvasSize: any) => number,
    populationToY: (pop: number, view: any, canvasSize: any) => number
) {
    if (!showIdeal) return;
    ctx.save();
    ctx.strokeStyle = '#00c853';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let points = [...idealPopulationCurve];
    const last = points[points.length - 1];
    if (last.month < 12) {
        points.push({ month: 12, value: last.value });
    }
    function getPt(idx: number) {
        if (idx < 0) return points[0];
        if (idx >= points.length) return points[points.length - 1];
        return points[idx];
    }
    let p0 = getPt(0), p1 = getPt(0), p2 = getPt(1), p3 = getPt(2);
    ctx.moveTo(monthToX(p1.month, view, canvasSize), populationToY(p1.value, view, canvasSize));
    for (let i = 0; i < points.length - 1; i++) {
        p0 = getPt(i - 1);
        p1 = getPt(i);
        p2 = getPt(i + 1);
        p3 = getPt(i + 2);
        const x1 = monthToX(p1.month, view, canvasSize);
        const y1 = populationToY(p1.value, view, canvasSize);
        const x2 = monthToX(p2.month, view, canvasSize);
        const y2 = populationToY(p2.value, view, canvasSize);
        const cp1x = x1 + (x2 - monthToX(p0.month, view, canvasSize)) / 6;
        const cp1y = y1 + (y2 - populationToY(p0.value, view, canvasSize)) / 6;
        const cp2x = x2 - (monthToX(p3.month, view, canvasSize) - x1) / 6;
        const cp2y = y2 - (populationToY(p3.value, view, canvasSize) - y1) / 6;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    }
    ctx.stroke();
    ctx.restore();
}

function drawCurrentPopulation(
    ctx: CanvasRenderingContext2D,
    showCurrent: boolean,
    hives: any[],
    todayMonth: number,
    view: { startMonth: number; monthsVisible: number },
    canvasSize: { width: number; height: number },
    monthToX: (month: number, view: any, canvasSize: any) => number,
    populationToY: (pop: number, view: any, canvasSize: any) => number
) {
    const { startMonth, monthsVisible } = view;
    const endMonth = startMonth + monthsVisible;
    if (!showCurrent || !hives) return;
    hives.forEach(hive => {
        if (todayMonth >= startMonth && todayMonth <= endMonth && hive.beeCount) {
            const x = monthToX(todayMonth, view, canvasSize);
            const y = populationToY(hive.beeCount, view, canvasSize);
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffd900';
            ctx.strokeStyle = '#333';
            ctx.fill();
            ctx.stroke();
        }
    });
}

function drawInspections(
    ctx: CanvasRenderingContext2D,
    showInspections: boolean,
    inspectionsByHive: Record<string, any[]>,
    view: { startMonth: number; monthsVisible: number },
    canvasSize: { width: number; height: number },
    monthToX: (month: number, view: any, canvasSize: any) => number,
    populationToY: (pop: number, view: any, canvasSize: any) => number
) {
    if (!showInspections) return;
    Object.entries(inspectionsByHive).forEach(([hiveId, insList]) => {
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        insList.forEach((ins, i) => {
            const x = monthToX(ins.date.getMonth(), view, canvasSize);
            const y = populationToY(ins.population, view, canvasSize);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        insList.forEach(ins => {
            const x = monthToX(ins.date.getMonth(), view, canvasSize);
            const y = populationToY(ins.population, view, canvasSize);
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#1976d2';
            ctx.strokeStyle = '#fff';
            ctx.fill();
            ctx.stroke();
        });
    });
}

function renderLegend(
    showIdeal: boolean,
    setShowIdeal: (v: boolean) => void,
    showCurrent: boolean,
    setShowCurrent: (v: boolean) => void,
    showInspections: boolean,
    setShowInspections: (v: boolean) => void
) {
    return (
        <div style={{ marginTop: 16, userSelect: 'none' }}>
            <b>Legend:</b>
            <label style={{ marginLeft: 10, color: '#00c853', cursor: 'pointer' }}>
                <input type="checkbox" checked={showIdeal} onChange={e => setShowIdeal((e.target as HTMLInputElement).checked)} /> Ideal population
            </label>
            <label style={{ marginLeft: 10, color: '#ffd900', cursor: 'pointer' }}>
                <input type="checkbox" checked={showCurrent} onChange={e => setShowCurrent((e.target as HTMLInputElement).checked)} /> Current population
            </label>
            <label style={{ marginLeft: 10, color: '#1976d2', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInspections} onChange={e => setShowInspections((e.target as HTMLInputElement).checked)} /> Inspections
            </label>
            <span style={{ marginLeft: 10, borderBottom: '2px dashed #ff0000' }}>Today</span>
        </div>
    );
}

export default function TimeView() {
    // Legend toggles
    const [showIdeal, setShowIdeal] = useState(true);
    const [showCurrent, setShowCurrent] = useState(true);
    const [showInspections, setShowInspections] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 400 });
    const maxPop = 80000;
    const minPop = 0;
    // Use fractional months for smooth drag
    const [view, setView] = useState({
        startMonth: todayMonth - 5 < 0 ? 0 : todayMonth - 5,
        monthsVisible: 11,
        minPop,
        maxPop
    });
    const [drag, setDrag] = useState<null | { x: number, startMonth: number }>(null);

    // Data loading from Dexie (with fallback to GraphQL)
    const { data: gqlData, loading: gqlLoading, error: gqlError } = useQuery(HIVES_QUERY, {});
    const hives = useLiveQuery(async () => {
        let localHives = await getHives();
        if ((!localHives || localHives.length === 0) && gqlData && gqlData.hives && gqlData.hives.length > 0) {
            // Upsert backend hives to Dexie
            await bulkUpsertHives(gqlData.hives);
            return gqlData.hives;
        }
        return localHives;
    }, [gqlData], []);

    const inspections = useLiveQuery(async () => {
        if (!hives || hives.length === 0) return [];
        // Gather all inspections for all hives
        const allInspections = [];
        for (const hive of hives) {
            const ins = await listInspections(hive.id);
            // Attach hive name for tooltip/grouping
            allInspections.push(...ins.map(i => ({
                ...i,
                hiveName: hive.name,
                date: i.added ? new Date(i.added) : new Date(),
            })));
        }
        return allInspections;
    }, [hives], []);

    if (!hives) return <Loader stroke="black" size={0}/>;
    if (!inspections) return <Loader stroke="black" size={0}/>;

    // Track yellow circle positions for tooltip
    const yellowCircles = useRef<any[]>([]);

    // Responsive canvas
    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setCanvasSize({ width, height: Math.round(width * 0.33) });
            }
        }
        updateSize();
        let observer: ResizeObserver | undefined;
        if (window.ResizeObserver) {
            observer = new ResizeObserver(updateSize);
            if (containerRef.current) observer.observe(containerRef.current);
        } else {
            window.addEventListener('resize', updateSize);
        }
        return () => {
            if (observer && containerRef.current) observer.unobserve(containerRef.current);
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    // Group inspections by hive
    const inspectionsByHive: Record<string, any[]> = {};
    inspections.forEach(ins => {
        if (!inspectionsByHive[ins.hiveId]) inspectionsByHive[ins.hiveId] = [];
        inspectionsByHive[ins.hiveId].push(ins);
    });



    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        drawYAxis(ctx, view, canvasSize, minPop, maxPop, populationToY);
        drawXAxis(ctx, view, canvasSize, monthToX, getMonthLabel);
        drawTodayLine(ctx, todayMonth, view, canvasSize, monthToX);
        drawIdealCurve(ctx, showIdeal, idealPopulationCurve, view, canvasSize, monthToX, populationToY);
        drawCurrentPopulation(ctx, showCurrent, hives, todayMonth, view, canvasSize, monthToX, populationToY);
        drawInspections(ctx, showInspections, inspectionsByHive, view, canvasSize, monthToX, populationToY);
    }, [view, canvasSize, showIdeal, showCurrent, showInspections, hives, todayMonth, inspectionsByHive]);

    // Mouse events for pan/zoom
    function onWheel(e) {
        e.preventDefault();
        let { startMonth, monthsVisible } = view;
        const mouseX = e.nativeEvent.offsetX;
        let zoomAmount = e.deltaY < 0 ? -1 : 1;
        let newMonthsVisible = Math.max(1, Math.min(12, monthsVisible + zoomAmount));
        // Zoom toward mouse
        let percent = mouseX / canvasSize.width;
        let centerMonth = startMonth + percent * monthsVisible;
        let newStart = centerMonth - percent * newMonthsVisible;
        // Clamp
        if (newStart < 0) newStart = 0;
        if (newStart + newMonthsVisible > 12) newStart = 12 - newMonthsVisible;
        setView(v => ({ ...v, startMonth: newStart, monthsVisible: newMonthsVisible }));
    }
    function onMouseDown(e) {
        setDrag({ x: e.nativeEvent.clientX, startMonth: view.startMonth });
    }
    function onMouseMove(e) {
        if (!drag) return;
        const dx = e.nativeEvent.clientX - drag.x;
        const monthsVisible = view.monthsVisible;
        const monthDelta = dx / (canvasSize.width / monthsVisible);
        let newStart = drag.startMonth - monthDelta;
        // Clamp
        if (newStart < 0) newStart = 0;
        if (newStart + monthsVisible > 12) newStart = 12 - monthsVisible;
        setView(v => ({ ...v, startMonth: newStart }));
    }
    function onMouseUp() {
        setDrag(null);
    }

    // Loading and error states (handled above by Loader)


    return (
        <div className={styles.flowWrap} ref={containerRef} style={{width: '100%'}}>
            <h2>Colony Lifecycle</h2>
            <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ width: '100%', height: canvasSize.height, background: '#fff', border: '1px solid #eee', cursor: drag ? 'grabbing' : 'grab' }}
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            />
            {renderLegend(showIdeal, setShowIdeal, showCurrent, setShowCurrent, showInspections, setShowInspections)}
        </div>
    );
}
