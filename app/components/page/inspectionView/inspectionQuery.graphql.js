"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../api");
exports.default = (0, api_1.gql) `
	query inspection($inspectionId: ID!, $hiveId: ID!) {
		inspection(inspectionId: $inspectionId) {
			id
			data
			added
		}
		hive(id: $hiveId) {
			id
			name
			boxCount

			inspections(limit: 20) {
				id
				added
				data
			}
		}
	}
`;
