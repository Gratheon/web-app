import { db } from './db';

import { Family } from '../api/schema'

export async function getFamilyByHive(hiveId: number): Promise<Family>{
    return await db['family'].get({hiveId})
}

export async function updateFamily(id:number, delta:object){
    return await db['family'].update(id, delta);
}