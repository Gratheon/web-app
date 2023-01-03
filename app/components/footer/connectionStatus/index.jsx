"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function connectionStatus({ graphqlWsClient }) {
    const [wsStatus, setWsStatus] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        graphqlWsClient.on('connected', () => {
            setWsStatus('green');
        });
        graphqlWsClient.on('closed', () => {
            setWsStatus('red');
        });
        graphqlWsClient.on('error', () => {
            setWsStatus('orange');
        });
    }, [graphqlWsClient]);
    return (<div title="Event delivery status" style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: wsStatus,
        }}></div>);
}
exports.default = connectionStatus;
