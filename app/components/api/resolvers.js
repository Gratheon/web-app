export default {
    user: async (_, { db }) => {
        return await db.user.limit(1).first()
    },
    apiaries: async (_, { db }) => {
        const apiaries = await db.apiary.limit(100).toArray()

        const apiariesWithHives = []

        for await (const apiary of apiaries) {
            const hives = await db.hive.limit(100).toArray()
            const hivesWithBoxes = []
            for await (const hive of hives) {
                const boxes = await db.box.limit(100).toArray()
                hivesWithBoxes.push({ ...hive, boxes })
            }
            apiariesWithHives.push({ ...apiary, hives: hivesWithBoxes })
        }

        return apiariesWithHives
    },

    hive: async (_, { db }, { variableValues: { id } }) => {
        const hive = await db.hive.where({ id }).first()

        if (!hive) {
            return
        }

        try {
            hive.family = await db.family.where({ hiveId: `${id}` }).first()
            //todo add file inside
            // hive.files = []; //await db.framesidefile.where({ hiveId: `${id}`}).toArray()
            hive.boxes = await db.box.where({ hiveId: `${id}` }).toArray()

            for await (const box of hive.boxes) {
                box.frames = await db.frame
                    .where({ boxId: `${box.id}` })
                    .toArray()

                for await (const frame of box.frames) {
                    const frames = await db.frameside
                        .where({ frameId: `${frame.id}` })
                        .toArray()

                    frame.leftSide = frames[0]
                    frame.rightSide = frames[1]
                }
            }
        } catch (e) {
            console.error(e)
        }
        return hive
    },
    hiveFrameSideFile: async () => {
        return await db.framesidefile.limit(100).toArray()[0]
    },
}