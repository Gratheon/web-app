"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("./frames");
const expect_1 = __importDefault(require("expect"));
// 2: [63 64 65]
// 1: [66]
const defaultFrameSet = [
    {
        boxIndex: 2,
        hiveId: 2,
        id: '63',
        position: 0,
        type: 'EMPTY_COMB',
        __typename: 'Frame',
    },
    {
        boxIndex: 2,
        hiveId: 2,
        id: '64',
        position: 1,
        type: 'EMPTY_COMB',
        __typename: 'Frame',
    },
    {
        boxIndex: 2,
        hiveId: 2,
        id: '65',
        position: 2,
        type: 'EMPTY_COMB',
        __typename: 'Frame',
    },
    {
        boxIndex: 1,
        hiveId: 2,
        id: '66',
        position: 0,
        type: 'EMPTY_COMB',
        __typename: 'Frame',
    },
];
it('removeAllFromBox', () => {
    // ARRANGE
    (0, frames_1.setFrames)(defaultFrameSet, { hiveId: 2 });
    // ACT
    (0, frames_1.removeAllFromBox)(2, 2);
    // ASSERT
    (0, expect_1.default)((0, frames_1.getFrames)({
        boxIndex: 1,
        hiveId: 2,
    }).length).toEqual(1);
});
describe('addFrame', () => {
    it('adds frame to the end', () => {
        // ARRANGE
        (0, frames_1.setFrames)(defaultFrameSet, { hiveId: 2 });
        // ACT
        (0, frames_1.addFrame)({ hiveId: 2, boxIndex: 1, frameType: 'VOID' });
        // ASSERT
        (0, expect_1.default)((0, frames_1.getFrames)({
            boxIndex: 1,
            hiveId: 2,
        }).length).toEqual(2);
    });
});
describe('moveFrame', () => {
    it('frame 63 >>', () => {
        // ARRANGE
        (0, frames_1.setFrames)(defaultFrameSet, { hiveId: 2 });
        // ACT
        (0, frames_1.moveFrame)({
            hiveId: 2,
            boxIndex: 2,
            removedIndex: 0,
            addedIndex: 1,
        });
        // ASSERT
        const result = (0, frames_1.getFrames)({
            boxIndex: 2,
            hiveId: 2,
        });
        // reordered
        (0, expect_1.default)(result[0].id).toEqual('64');
        (0, expect_1.default)(result[1].id).toEqual('63');
        (0, expect_1.default)(result[2].id).toEqual('65');
    });
    it('frame 63 >> end', () => {
        // ARRANGE
        (0, frames_1.setFrames)(defaultFrameSet, { hiveId: 2 });
        // ACT
        (0, frames_1.moveFrame)({
            hiveId: 2,
            boxIndex: 2,
            removedIndex: 0,
            addedIndex: 2,
        });
        // ASSERT
        const result = (0, frames_1.getFrames)({
            boxIndex: 2,
            hiveId: 2,
        });
        // reordered
        (0, expect_1.default)(result[0].id).toEqual('64');
        (0, expect_1.default)(result[1].id).toEqual('65');
        (0, expect_1.default)(result[2].id).toEqual('63');
    });
    it('frame 65 <<', () => {
        // ARRANGE
        (0, frames_1.setFrames)(defaultFrameSet, { hiveId: 2 });
        // ACT
        (0, frames_1.moveFrame)({
            hiveId: 2,
            boxIndex: 2,
            removedIndex: 2,
            addedIndex: 1,
        });
        // ASSERT
        const result = (0, frames_1.getFrames)({
            boxIndex: 2,
            hiveId: 2,
        });
        // reordered
        (0, expect_1.default)(result[0].id).toEqual('63');
        (0, expect_1.default)(result[1].id).toEqual('65');
        (0, expect_1.default)(result[2].id).toEqual('64');
    });
    it('frame 65 << beginning', () => {
        // ARRANGE
        (0, frames_1.setFrames)(defaultFrameSet, { hiveId: 2 });
        // ACT
        (0, frames_1.moveFrame)({
            hiveId: 2,
            boxIndex: 2,
            removedIndex: 2,
            addedIndex: 0,
        });
        // ASSERT
        const result = (0, frames_1.getFrames)({
            boxIndex: 2,
            hiveId: 2,
        });
        // reordered
        (0, expect_1.default)(result[0].id).toEqual('65');
        (0, expect_1.default)(result[1].id).toEqual('63');
        (0, expect_1.default)(result[2].id).toEqual('64');
    });
});
