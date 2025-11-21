import React, { useRef, useState, useMemo } from 'react';
import styles from './styles.module.less';
import Loader from '@/shared/loader';
import { useLiveQuery } from 'dexie-react-hooks';
import { getHives, bulkUpsertHives } from '../../models/hive';
import { listInspections } from '../../models/inspections';
import { useQuery, gql } from '../../api';
import imageURL from '@/assets/flower.png';
import { Chart, LineSeries, AreaSeries, Markers } from 'lightweight-charts-react-components';

const HIVES_QUERY = gql`
  query HIVES {
    apiaries {
      id
      hives {
        id
        name
        notes
        status
        inspectionCount
        collapse_date
        collapse_cause
        family {
          id
        }
      }
    }
  }
`;

const WEIGHT_QUERY = gql`
  query HiveWeights($hiveIds: [ID!]!, $timeRangeMin: Int!) {
    ${`hive_HIVE_ID: weightKg(hiveId: "HIVE_ID", timeRangeMin: $timeRangeMin) {
      ... on MetricFloatList {
        metrics {
          t
          v
        }
      }
      ... on TelemetryError {
        message
        code
      }
    }`}
  }
`;

const idealPopulationCurve = [
    { month: 0, value: 10000 },
    { month: 2, value: 15000 },
    { month: 5, value: 40000 },
    { month: 8, value: 35000 },
    { month: 11, value: 12000 }
];

function interpolateIdealCurve(curve: { month: number; value: number }[]) {
    const result = [];
    const year = new Date().getFullYear();

    for (let i = 0; i < curve.length - 1; i++) {
        const start = curve[i];
        const end = curve[i + 1];
        const monthDiff = end.month - start.month;
        const daysBetween = monthDiff * 30;

        for (let day = 0; day <= daysBetween; day++) {
            const t = day / daysBetween;
            const value = start.value + (end.value - start.value) * t;
            const date = new Date(year, 0, 1 + start.month * 30 + day);
            const timestamp = Math.floor(date.getTime() / 1000);

            if (result.length === 0 || result[result.length - 1].time !== timestamp) {
                result.push({
                    time: timestamp as any,
                    value: Math.round(value)
                });
            }
        }
    }

    return result;
}

function renderLegend(
    showIdeal: boolean,
    setShowIdeal: (v: boolean) => void,
    showCurrent: boolean,
    setShowCurrent: (v: boolean) => void,
    showInspections: boolean,
    setShowInspections: (v: boolean) => void,
    showWeight: boolean,
    setShowWeight: (v: boolean) => void
) {
    return (
        <div style={{ marginTop: 16, userSelect: 'none' }}>
            <b>Legend:</b>
            <label style={{ marginLeft: 10, color: '#00c853', cursor: 'pointer' }}>
                <input type="checkbox" checked={showIdeal} onChange={e => setShowIdeal((e.target as HTMLInputElement).checked)} /> Ideal population
            </label>
            <label style={{ marginLeft: 10, color: '#d32f2f', cursor: 'pointer' }}>
                <input type="checkbox" checked={showWeight} onChange={e => setShowWeight((e.target as HTMLInputElement).checked)} /> Hive Weight (grams)
            </label>
            <label style={{ marginLeft: 10, color: '#1976d2', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInspections} onChange={e => setShowInspections((e.target as HTMLInputElement).checked)} /> Inspections
            </label>
            <span style={{ marginLeft: 10, borderBottom: '2px dashed #ff0000' }}>Today</span>
        </div>
    );
}

export default function TimeView() {
    const [showIdeal, setShowIdeal] = useState(true);
    const [showCurrent, setShowCurrent] = useState(true);
    const [showInspections, setShowInspections] = useState(true);
    const [showWeight, setShowWeight] = useState(true);
    const chartApiRef = useRef(null);

    const { data: gqlData } = useQuery(HIVES_QUERY, {});
    const hives = useLiveQuery(async () => {
        let localHives = await getHives();
        if ((!localHives || localHives.length === 0) && gqlData && gqlData.apiaries) {
            const allHives = gqlData.apiaries.flatMap(apiary => apiary.hives || []);
            if (allHives.length > 0) {
                await bulkUpsertHives(allHives);
                return allHives;
            }
        }
        return localHives;
    }, [gqlData], []);

    const hiveIds = useMemo(() => hives?.map(h => h.id) || [], [hives]);

    const weightQueryString = useMemo(() => {
        if (!hiveIds.length) return null;
        const queries = hiveIds.map(id => `
          hive_${id}: weightKgAggregated(hiveId: "${id}", days: $days, aggregation: DAILY_AVG) {
            ... on MetricFloatList {
              metrics {
                t
                v
              }
            }
            ... on TelemetryError {
              message
              code
            }
          }
        `).join('\n');

        return gql`
          query HiveWeights($days: Int!) {
            ${queries}
          }
        `;
    }, [hiveIds]);

    const { data: weightData } = useQuery(weightQueryString || HIVES_QUERY, {
        skip: !weightQueryString,
        variables: { days: 365 }
    });

    const inspections = useLiveQuery(async () => {
        if (!hives || hives.length === 0) return [];
        const allInspections = [];
        for (const hive of hives) {
            const ins = await listInspections(hive.id);
            allInspections.push(...ins.map(i => ({
                ...i,
                hiveName: hive.name,
                hiveId: hive.id,
                date: i.added ? new Date(i.added) : new Date(),
            })));
        }
        return allInspections;
    }, [hives], []);

    if (!hives || !inspections) return <Loader stroke="black" size={0}/>;

    if (hives.length === 0) {
        return (
            <div className={styles.flowWrap} style={{width: '100%', textAlign: 'center', padding: '20px 0', color: 'gray'}}>
                <h2>Colonies Lifecycle</h2>
                <p>This view shows how colonies develop over time. Add an apiary with a hive to see first data here.</p>
                <img height="64" src={imageURL} alt="Flower illustration" />
            </div>
        );
    }

    const idealData = useMemo(() => interpolateIdealCurve(idealPopulationCurve), []);

    const inspectionsByHive = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        inspections.forEach(ins => {
            if (!grouped[ins.hiveId]) grouped[ins.hiveId] = [];
            grouped[ins.hiveId].push(ins);
        });
        Object.keys(grouped).forEach(hiveId => {
            grouped[hiveId].sort((a, b) => a.date.getTime() - b.date.getTime());
        });
        return grouped;
    }, [inspections]);

    const inspectionSeriesData = useMemo(() => {
        const seriesMap: Record<string, { data: any[], hiveName: string }> = {};

        Object.entries(inspectionsByHive).forEach(([hiveId, insList]) => {
            const data = insList
                .filter(ins => ins.population && ins.population > 0)
                .map(ins => ({
                    time: Math.floor(ins.date.getTime() / 1000) as any,
                    value: ins.population
                }));

            if (data.length > 0) {
                seriesMap[hiveId] = {
                    data,
                    hiveName: insList[0]?.hiveName || `Hive ${hiveId}`
                };
            }
        });

        return seriesMap;
    }, [inspectionsByHive]);

    const weightSeriesData = useMemo(() => {
        if (!weightData || !hives) return {};

        const seriesMap: Record<string, { data: any[], hiveName: string }> = {};

        hives.forEach(hive => {
            const weightKey = `hive_${hive.id}`;
            const hiveWeight = weightData[weightKey];

            if (hiveWeight && hiveWeight.metrics && hiveWeight.metrics.length > 0) {
                const data = hiveWeight.metrics
                    .filter(m => m.v && m.v > 0)
                    .map(m => ({
                        time: Math.floor(new Date(m.t).getTime() / 1000) as any,
                        value: Math.round(m.v * 1000)
                    }));

                if (data.length > 0) {
                    seriesMap[hive.id] = {
                        data,
                        hiveName: hive.name || `Hive ${hive.id}`
                    };
                }
            }
        });

        return seriesMap;
    }, [weightData, hives]);

    const chartOptions = useMemo(() => ({
        layout: {
            attributionLogo: false,
            textColor: '#333',
            background: { color: '#fff' }
        },
        grid: {
            vertLines: { color: '#eee' },
            horzLines: { color: '#eee' }
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
            fixLeftEdge: false,
            fixRightEdge: false,
        },
        rightPriceScale: {
            borderColor: '#ccc',
        },
        crosshair: {
            mode: 1,
        },
    }), []);

    return (
        <div className={styles.flowWrap} style={{width: '100%'}}>
            <h2>Colony Lifecycle</h2>
            <Chart
                options={chartOptions}
                containerProps={{ style: { width: '100%', height: '500px', border: '1px solid #eee' } }}
                onInit={(chart) => {
                    chartApiRef.current = chart;
                }}
            >
                {showIdeal && (
                    <AreaSeries
                        data={idealData}
                        options={{
                            topColor: 'rgba(0, 200, 83, 0.4)',
                            bottomColor: 'rgba(0, 200, 83, 0.05)',
                            lineColor: '#00c853',
                            lineWidth: 2,
                            title: 'Ideal Population',
                        }}
                    />
                )}

                {showInspections && Object.entries(inspectionSeriesData).map(([hiveId, { data, hiveName }]) => {
                    const colors = ['#1976d2', '#9c27b0', '#f57c00', '#00897b', '#e91e63'];
                    const colorIndex = Object.keys(inspectionSeriesData).indexOf(hiveId) % colors.length;
                    const color = colors[colorIndex];

                    const markers = data.map(d => ({
                        time: d.time,
                        position: 'inBar' as const,
                        color: color,
                        shape: 'circle' as const,
                    }));

                    return (
                        <LineSeries
                            key={hiveId}
                            data={data}
                            options={{
                                color: color,
                                lineWidth: 2,
                                title: hiveName,
                            }}
                        >
                            <Markers markers={markers} />
                        </LineSeries>
                    );
                })}

                {showWeight && Object.entries(weightSeriesData).map(([hiveId, { data, hiveName }]) => {
                    const colors = ['#d32f2f', '#1976d2', '#388e3c', '#f57c00', '#7b1fa2'];
                    const colorIndex = Object.keys(weightSeriesData).indexOf(hiveId) % colors.length;
                    const color = colors[colorIndex];

                    return (
                        <LineSeries
                            key={hiveId}
                            data={data}
                            options={{
                                color: color,
                                lineWidth: 2,
                                title: `${hiveName} Weight`,
                            }}
                        />
                    );
                })}
            </Chart>
            {renderLegend(showIdeal, setShowIdeal, showCurrent, setShowCurrent, showInspections, setShowInspections, showWeight, setShowWeight)}

            <div style={{ marginTop: 40 }}>
                <h3>Debug Data</h3>

                <h4>Hives ({hives.length})</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>ID</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Name</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Status</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Inspection Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hives.map(hive => (
                            <tr key={hive.id}>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{hive.id}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{hive.name}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{hive.status}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{hive.inspectionCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h4>Inspections ({inspections.length})</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Hive</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Date</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Population</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Raw Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inspections.map((ins, idx) => (
                            <tr key={idx}>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{ins.hiveName || ins.hiveId}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{ins.date.toLocaleString()}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{ins.population || 'N/A'}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8, fontSize: '0.8em' }}>
                                    <details>
                                        <summary>Show raw</summary>
                                        <pre style={{ fontSize: '0.9em', maxWidth: 400, overflow: 'auto' }}>
                                            {JSON.stringify(ins, null, 2)}
                                        </pre>
                                    </details>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h4>Processed Series Data ({Object.keys(inspectionSeriesData).length} hives)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Hive ID</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Hive Name</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data Points</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(inspectionSeriesData).map(([hiveId, { data, hiveName }]) => (
                            <tr key={hiveId}>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{hiveId}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{hiveName}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8 }}>{data.length}</td>
                                <td style={{ border: '1px solid #ddd', padding: 8, fontSize: '0.8em' }}>
                                    <details>
                                        <summary>Show data</summary>
                                        <pre style={{ fontSize: '0.9em', maxWidth: 400, overflow: 'auto' }}>
                                            {JSON.stringify(data.map(d => ({
                                                date: new Date(d.time * 1000).toLocaleString(),
                                                value: d.value
                                            })), null, 2)}
                                        </pre>
                                    </details>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h4>Weight Metrics ({Object.keys(weightSeriesData).length} hives)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Hive ID</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Hive Name</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data Points</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Weight Range</th>
                            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(weightSeriesData).map(([hiveId, { data, hiveName }]) => {
                            const values = data.map(d => d.value);
                            const min = Math.min(...values);
                            const max = Math.max(...values);
                            return (
                                <tr key={hiveId}>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{hiveId}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{hiveName}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{data.length}</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{min}g - {max}g</td>
                                    <td style={{ border: '1px solid #ddd', padding: 8, fontSize: '0.8em' }}>
                                        <details>
                                            <summary>Show data</summary>
                                            <pre style={{ fontSize: '0.9em', maxWidth: 400, overflow: 'auto' }}>
                                                {JSON.stringify(data.slice(0, 10).map(d => ({
                                                    date: new Date(d.time * 1000).toLocaleString(),
                                                    weight: `${d.value}g`
                                                })), null, 2)}
                                                {data.length > 10 ? `\n... and ${data.length - 10} more` : ''}
                                            </pre>
                                        </details>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
