import { useEffect } from 'react';
import { gql, useSubscription } from '@/api';
import {
    appendBeeDetectionData,
    appendQueenDetectionData,
    appendResourceDetectionData,
    appendQueenCupDetectionData
} from '@/models/frameSideFile';
import { getFrameSide, upsertFrameSide, FrameSide as FrameSideType } from '@/models/frameSide';

// Define types for subscription data payloads
// (These should ideally match the GraphQL schema fragments)
interface BeeDetectionData {
    onFrameSideBeesPartiallyDetected: {
        delta: any[];
        detectedQueenCount: number;
        detectedWorkerBeeCount: number;
        detectedDroneCount: number;
        isBeeDetectionComplete: boolean;
    };
}

interface ResourceDetectionData {
    onFrameSideResourcesDetected: {
        delta: any[];
        isCellsDetectionComplete: boolean;
        broodPercent: number;
        cappedBroodPercent: number;
        eggsPercent: number;
        pollenPercent: number;
        honeyPercent: number;
    };
}

interface QueenCupDetectionData {
    onFrameQueenCupsDetected: {
        delta: any[];
        isQueenCupsDetectionComplete: boolean;
    };
}

interface QueenDetectionData {
    onFrameQueenDetected: {
        delta: any[];
        isQueenDetectionComplete?: boolean | null; // Allow null/undefined
    };
}


export function useFrameSideSubscriptions(frameSideId: number | string | null | undefined) {
    const numericFrameSideId = frameSideId ? +frameSideId : 0;
    const shouldSubscribe = !!numericFrameSideId;
    const variables = { frameSideId: String(frameSideId) }; // Stable variable object

    // --- Log Pause Status ---
    useEffect(() => {
        console.log(`useFrameSideSubscriptions: frameSideId=${frameSideId}, shouldSubscribe=${shouldSubscribe}`);
    }, [frameSideId, shouldSubscribe]);

    // --- Bee Detection Subscription ---
    const beesQuery = gql`
        subscription onFrameSideBeesPartiallyDetected($frameSideId: String) {
            onFrameSideBeesPartiallyDetected(frameSideId: $frameSideId) {
                delta
                detectedQueenCount
                detectedWorkerBeeCount
                detectedDroneCount
                isBeeDetectionComplete
            }
        }
    `;
    const beesRes = useSubscription( // Call adapted hook correctly
        shouldSubscribe ? beesQuery : null, // Pass query conditionally
        variables // Pass variables as second arg
        // No handler needed here
    );

    useEffect(() => {
        // Check if fetching is complete and data exists
        if (!beesRes.fetching && beesRes.data?.onFrameSideBeesPartiallyDetected && numericFrameSideId) {
            console.log('Received Bee Data:', beesRes.data);
            const updatePayload = beesRes.data.onFrameSideBeesPartiallyDetected;
            appendBeeDetectionData(numericFrameSideId, {
                delta: updatePayload.delta || [],
                detectedQueenCount: updatePayload.detectedQueenCount,
                detectedWorkerBeeCount: updatePayload.detectedWorkerBeeCount,
                detectedDroneCount: updatePayload.detectedDroneCount,
                isBeeDetectionComplete: updatePayload.isBeeDetectionComplete,
            }).catch(error => console.error("Failed to append bee data:", error));
        }
        // Log errors if they occur
        if (beesRes.error) {
            console.error("Bee Subscription Error:", beesRes.error);
        }
    }, [beesRes.data, beesRes.error, beesRes.fetching, numericFrameSideId]); // Depend on data, error, fetching

    // --- Resource Detection Subscription ---
    const resourcesQuery = gql`
        subscription onFrameSideResourcesDetected($frameSideId: String) {
            onFrameSideResourcesDetected(frameSideId: $frameSideId) {
                delta
                isCellsDetectionComplete
                broodPercent
                cappedBroodPercent
                eggsPercent
                pollenPercent
                honeyPercent
            }
        }
    `;
    const resourcesRes = useSubscription( // Call adapted hook correctly
        shouldSubscribe ? resourcesQuery : null, // Pass query conditionally
        variables // Pass variables as second arg
    );

    useEffect(() => {
        // Check if fetching is complete and data exists
        if (!resourcesRes.fetching && resourcesRes.data?.onFrameSideResourcesDetected && numericFrameSideId) {
            console.log('Received Resource Data:', resourcesRes.data);
            const updatePayload = resourcesRes.data.onFrameSideResourcesDetected;
            appendResourceDetectionData(numericFrameSideId, {
                delta: updatePayload.delta || [],
                isCellsDetectionComplete: updatePayload.isCellsDetectionComplete,
                broodPercent: updatePayload.broodPercent,
                cappedBroodPercent: updatePayload.cappedBroodPercent,
                eggsPercent: updatePayload.eggsPercent,
                pollenPercent: updatePayload.pollenPercent,
                honeyPercent: updatePayload.honeyPercent,
            }).catch(error => console.error("Failed to append resource data:", error));
        }
        // Log errors if they occur
        if (resourcesRes.error) {
            console.error("Resource Subscription Error:", resourcesRes.error);
        }
    }, [resourcesRes.data, resourcesRes.error, resourcesRes.fetching, numericFrameSideId]); // Depend on data, error, fetching

    // --- Queen Cup Detection Subscription ---
    const queenCupsQuery = gql`
        subscription onFrameQueenCupsDetected($frameSideId: String) {
            onFrameQueenCupsDetected(frameSideId: $frameSideId) {
                delta
                isQueenCupsDetectionComplete
            }
        }
    `;
    const queenCupsRes = useSubscription( // Call adapted hook correctly
        shouldSubscribe ? queenCupsQuery : null, // Pass query conditionally
        variables // Pass variables as second arg
    );

    useEffect(() => {
        // Check if fetching is complete and data exists
        if (!queenCupsRes.fetching && queenCupsRes.data?.onFrameQueenCupsDetected && numericFrameSideId) {
            console.log('Received Queen Cup Data:', queenCupsRes.data);
            const updatePayload = queenCupsRes.data.onFrameQueenCupsDetected;
            appendQueenCupDetectionData(numericFrameSideId, {
                delta: updatePayload.delta || [],
                isQueenCupsDetectionComplete: updatePayload.isQueenCupsDetectionComplete,
            }).catch(error => console.error("Failed to append queen cup data:", error));
        }
        // Log errors if they occur
        if (queenCupsRes.error) {
            console.error("Queen Cup Subscription Error:", queenCupsRes.error);
        }
    }, [queenCupsRes.data, queenCupsRes.error, queenCupsRes.fetching, numericFrameSideId]); // Depend on data, error, fetching

    // --- Queen Detection Subscription ---
    const queenQuery = gql`
        subscription onFrameQueenDetected($frameSideId: String) {
            onFrameQueenDetected(frameSideId: $frameSideId) {
                delta
                isQueenDetectionComplete
            }
        }
    `;
    const queenRes = useSubscription( // Call adapted hook correctly
        shouldSubscribe ? queenQuery : null, // Pass query conditionally
        variables // Pass variables as second arg
    );

    useEffect(() => {
        // Check if fetching is complete and data exists
        if (!queenRes.fetching && queenRes.data?.onFrameQueenDetected && numericFrameSideId) {
            console.log('Received Queen Data:', queenRes.data);
            const queenData = queenRes.data.onFrameQueenDetected;
            appendQueenDetectionData(numericFrameSideId, {
                delta: queenData.delta || [],
                isQueenDetectionComplete: queenData.isQueenDetectionComplete !== undefined && queenData.isQueenDetectionComplete !== null
                    ? !!queenData.isQueenDetectionComplete
                    : false,
            }).catch(error => console.error("Failed to append queen data:", error));

            const aiFoundQueen = queenData.delta && queenData.delta.length > 0;
            if (aiFoundQueen) {
                getFrameSide(numericFrameSideId).then(currentFrameSide => {
                    if (currentFrameSide && !currentFrameSide.isQueenConfirmed) {
                        console.log('AI found queen, confirming in FrameSide model');
                        const updatedFrameSideState: FrameSideType = {
                            ...currentFrameSide,
                            isQueenConfirmed: true,
                        };
                        upsertFrameSide(updatedFrameSideState);
                    }
                });
            }
        }
        // Log errors if they occur
        if (queenRes.error) {
            console.error("Queen Subscription Error:", queenRes.error);
        }
    }, [queenRes.data, queenRes.error, queenRes.fetching, numericFrameSideId]); // Depend on data, error, fetching
}
