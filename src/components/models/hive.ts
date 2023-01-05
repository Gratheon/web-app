import { db } from './db';

type Hive = {
    id: number
    name?: string
    notes?: string
    boxCount: number
}

export async function getHive(id: number): Promise<Hive>{
    return await db['hive'].get(id)
}

export async function updateHive(id:number, delta:object){
    console.log('updating hive', {id, delta});
    return await db['hive'].update(id, delta);
}