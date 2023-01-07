import { db } from './db'
import {getFrame} from './frames';

type FrameSide = {
    id: number
    queenDetected?: boolean
    pollenPercent?: number
    honeyPercent?:number
    droneBroodPercent?:number
    cappedBroodPercent?:number
    broodPercent?:number
}
export async function getFrameSide({frameId, frameSide}): Promise<FrameSide>{
    const frame = await getFrame(frameId);

    if(!frame){
        return null;
    }

    return await db['frameside'].get(frameSide==='left' ? frame?.leftId : frame?.rightId);
}