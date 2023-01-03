"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expect_1 = __importDefault(require("expect"));
const boxes_1 = require("./boxes");
describe('moveBoxDown', () => {
    it('should not move position with 0 higher', () => {
        (0, boxes_1.setBoxes)([
            {
                hiveId: 1,
                id: '11',
                position: 0,
                type: 'DEEP',
                __typename: 'Box',
            },
        ]);
        (0, boxes_1.moveBoxDown)({
            hiveId: '1',
            index: 0,
        });
        (0, expect_1.default)((0, boxes_1.getBoxes)({
            hiveId: 1,
        })[0].position).toEqual(0);
    });
    it('should not move position with 0 higher', () => {
        (0, boxes_1.setBoxes)([
            {
                hiveId: 1,
                id: '11',
                position: 1,
                type: 'DEEP',
                __typename: 'Box',
            },
            {
                hiveId: 1,
                id: '12',
                position: 0,
                type: 'DEEP',
                __typename: 'Box',
            },
        ]);
        (0, boxes_1.moveBoxDown)({
            hiveId: '1',
            index: 1,
        });
        (0, expect_1.default)((0, boxes_1.getBoxes)({
            hiveId: 1,
        })[0].id).toEqual('12');
    });
});
describe('moveBoxDown', () => {
    it('should not move position with 0 higher', () => {
        (0, boxes_1.setBoxes)([
            {
                hiveId: 1,
                id: '11',
                position: 1,
                type: 'DEEP',
                __typename: 'Box',
            },
            {
                hiveId: 1,
                id: '12',
                position: 0,
                type: 'DEEP',
                __typename: 'Box',
            },
        ]);
        (0, boxes_1.removeBox)({
            hiveId: '1',
            position: 0,
        });
        const boxes = (0, boxes_1.getBoxes)({
            hiveId: 1,
        });
        (0, expect_1.default)(boxes.length).toEqual(1);
        (0, expect_1.default)(boxes[0].position).toEqual(0);
    });
});
