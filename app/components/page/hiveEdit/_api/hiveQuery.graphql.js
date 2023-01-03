"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../../api");
exports.default = (0, api_1.gql) `
	query hive($id: ID!) {
		hive(id: $id) {
			id
			name
			notes
			boxCount

			files {
				hiveId
				frameSideId
				strokeHistory
				file {
					id
					url
				}
			}

			inspections(limit: 20) {
				id
				added
				data
			}

			family {
				id
				race
				added
			}

			boxes {
				id
				position
				type
				color

				frames {
					id
					position
					type

					leftSide {
						id
						broodPercent
						honeyPercent
						pollenPercent
						droneBroodPercent
						cappedBroodPercent
						queenDetected
					}

					rightSide {
						id
						broodPercent
						honeyPercent
						pollenPercent
						droneBroodPercent
						cappedBroodPercent
						queenDetected
					}
				}
			}
		}
	}
`;
