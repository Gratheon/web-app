"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const leaflet_1 = require("leaflet");
const react_leaflet_1 = require("react-leaflet");
require("leaflet/dist/leaflet.css");
const react_leaflet_2 = require("react-leaflet");
const marker_icon_png_1 = __importDefault(require("./images/marker-icon.png"));
const marker_icon_2x_png_1 = __importDefault(require("./images/marker-icon-2x.png"));
function LocationMarker({ onMarkerSet, lat, lng, autoLocate = false }) {
    const [position, setPosition] = (0, react_1.useState)({
        lat,
        lng,
    });
    const markerRef = (0, react_1.useRef)(null);
    const map = (0, react_leaflet_1.useMapEvents)({
        // click() {
        // 	map.locate()
        // },
        locationfound(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
            onMarkerSet(e.latlng, map.getZoom());
        },
    });
    (0, react_1.useMemo)(() => {
        map.locate();
    }, [autoLocate]);
    const eventHandlers = (0, react_1.useMemo)(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                setPosition(marker.getLatLng());
                onMarkerSet(marker.getLatLng(), map.getZoom());
            }
        },
    }), []);
    return position === null ? null : (<react_leaflet_1.Marker position={position} draggable={true} eventHandlers={eventHandlers} ref={markerRef} icon={new leaflet_1.Icon({
            iconUrl: marker_icon_png_1.default,
            iconRetinaUrl: marker_icon_2x_png_1.default,
            placement: 'center',
            iconSize: [12, 20],
            iconAnchor: [6, 10],
            popupAnchor: [0, 0],
        })}>
			<react_leaflet_1.Popup>You are here</react_leaflet_1.Popup>
		</react_leaflet_1.Marker>);
}
const Map = ({ lat = 0, lng = 0, autoLocate, onMarkerSet = () => { } }) => {
    return (<div>
			<react_leaflet_1.MapContainer style={{ width: '100%', height: 300 }} center={[lat, lng]} zoom={15} zoomControl={true} dragging={true} scrollWheelZoom={true} whenReady={() => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('resize'));
            }
        }}>
				<ChangeView center={[lat, lng]}/>
				<react_leaflet_1.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
				<LocationMarker autoLocate={autoLocate} onMarkerSet={onMarkerSet} lat={lat} lng={lng}/>

				<react_leaflet_1.LayerGroup>
					<react_leaflet_1.Circle center={[lat, lng]} opacity="0.5" fillOpacity="0.3" pathOptions={{ fillColor: 'orange', color: 'orange' }} radius={1000}/>
					<react_leaflet_1.Circle center={[lat, lng]} opacity="0.5" pathOptions={{ fillColor: 'green', color: 'green' }} radius={3000}/>
				</react_leaflet_1.LayerGroup>
			</react_leaflet_1.MapContainer>
		</div>);
};
const ChangeView = ({ center }) => {
    const map = (0, react_leaflet_2.useMap)();
    map.setView(center);
    return null;
};
exports.default = Map;
