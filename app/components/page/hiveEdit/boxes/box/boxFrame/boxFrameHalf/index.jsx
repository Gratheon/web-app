"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
const react_router_dom_1 = require("react-router-dom");
const colors_1 = __importDefault(require("../../../../../../colors"));
exports.default = ({ frameSide, className, href }) => {
    let navigate = (0, react_router_dom_1.useNavigate)();
    return (<div className={`${index_less_1.default.frameSide} ${className}`} onClick={() => {
            navigate(href, { replace: true });
        }}>
			<div style={{
            height: `${frameSide.cappedBroodPercent ? frameSide.cappedBroodPercent : 0}%`,
            backgroundColor: colors_1.default.cappedBroodColor,
        }} title="Capped brood"></div>

			<div style={{
            height: `${frameSide.broodPercent ? frameSide.broodPercent : 0}%`,
            backgroundColor: colors_1.default.broodColor,
        }} title="Brood"></div>

			<div style={{
            height: `${frameSide.droneBroodPercent ? frameSide.droneBroodPercent : 0}%`,
            backgroundColor: colors_1.default.droneBroodColor,
        }} title="Drone brood"></div>

			<div style={{
            height: `${frameSide.pollenPercent ? frameSide.pollenPercent : 0}%`,
            backgroundColor: colors_1.default.pollenColor,
        }} title="Pollen"></div>

			<div style={{
            height: `${frameSide.honeyPercent ? frameSide.honeyPercent : 0}%`,
            backgroundColor: colors_1.default.honeyColor,
            // backgroundImage: "url('/assets/cell.png')",
            backgroundSize: '3px 4px',
        }} title="Capped honey"></div>

			<div style={{ flexGrow: 1 }}/>
		</div>);
};
