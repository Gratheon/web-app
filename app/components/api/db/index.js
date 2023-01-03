"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeHooks = exports.syncGraphqlSchemaToIndexDB = exports.db = void 0;
//@ts-nocheck
const dexie_1 = __importDefault(require("dexie"));
exports.db = new dexie_1.default('gratheon');
function syncGraphqlSchemaToIndexDB(schemaObject) {
    const typeMap = schemaObject.getTypeMap();
    const dbSchema = {};
    for (const type of Object.values(typeMap)) {
        if (type.astNode && type.astNode.kind === 'ObjectTypeDefinition') {
            const objName = type.astNode.name.value.toLowerCase();
            if (objName === 'mutation' || objName === 'query' || objName === 'error') {
                continue;
            }
            const fields = type.getFields();
            const fieldStrings = [];
            for (const field of Object.values(fields)) {
                fieldStrings.push(field.name == 'id' ? '&id' : field.name);
            }
            dbSchema[objName] = fieldStrings.join(', ');
        }
    }
    addCustomIndexes(dbSchema);
    //console.info('saving schema', dbSchema)
    exports.db.version(1).stores(dbSchema);
}
exports.syncGraphqlSchemaToIndexDB = syncGraphqlSchemaToIndexDB;
function addCustomIndexes(dbSchema) {
    dbSchema.family += ',hiveId';
    dbSchema.box += ',hiveId';
    dbSchema.file += ',hiveId';
    dbSchema.frame += ',boxId';
    dbSchema.frameside += ',frameId';
}
async function upsertEntity(entityName, entity) {
    // console.log(`updating ${entityName} entity`, entity);
    const ex = await exports.db[entityName].get(entity.id);
    await exports.db[entityName].put({
        ...ex,
        ...entity
    });
}
exports.writeHooks = {
    Apiary: async (_, apiary) => await upsertEntity('apiary', apiary),
    Hive: async (_, hive) => await upsertEntity('hive', hive),
    Box: async (parent, box) => {
        box.hiveId = parent.id;
        await upsertEntity('box', box);
    },
    Family: async ({ id }, family) => {
        family.hiveId = id;
        await upsertEntity('family', family);
    },
    Frame: async ({ id }, frame) => {
        frame.boxId = id;
        await upsertEntity('frame', frame);
    },
    FrameSide: async ({ id }, frameside) => {
        frameside.frameId = id;
        await upsertEntity('frameside', frameside);
    },
    FrameSideFile: async (_, frameSideFile) => {
        if (Object.keys(frameSideFile).length === 0)
            return;
        frameSideFile.id = `${frameSideFile.frameSideId}`;
        await upsertEntity('framesidefile', frameSideFile);
    },
    File: async ({ hiveId }, file) => {
        file.hiveId = hiveId;
        await upsertEntity('file', file);
    },
    User: async (_, user) => await upsertEntity('user', user)
};
