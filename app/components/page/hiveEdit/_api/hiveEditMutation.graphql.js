"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../../api");
exports.default = (0, api_1.gql) `
	mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
		}
	}
`;
