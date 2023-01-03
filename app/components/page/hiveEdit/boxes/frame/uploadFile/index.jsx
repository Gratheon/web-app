"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const react_1 = __importDefault(require("react"));
const api_1 = require("../../../../../api");
const messageError_1 = __importDefault(require("../../../../../shared/messageError"));
const loader_1 = __importDefault(require("../../../../../shared/loader"));
const dragDrop_1 = __importDefault(require("./dragDrop"));
const hooks_1 = require("preact/hooks");
const index_less_1 = __importDefault(require("./index.less"));
const uploadIcon_1 = __importDefault(require("../../../../../../icons/uploadIcon"));
function UploadFile({ onUpload }) {
    //todo
    //@ts-ignore
    const [uploadFile, { loading, error, data }] = (0, api_1.useUploadMutation)((0, api_1.gql) `
	mutation uploadFrameSide($file: Upload!) {
		uploadFrameSide(file: $file) {
			id
			url
		}
	}
`);
    const [fileList, setFiles] = (0, hooks_1.useState)([]);
    async function onFileSelect({ target: { validity, files: [file], }, }) {
        if (!validity.valid) {
            return;
        }
        //@ts-ignore
        const { data, error } = await uploadFile({ file });
        if (!error) {
            //trigger higher component joining file with hive info
            onUpload(data.uploadFrameSide);
        }
    }
    if (loading)
        return <loader_1.default />;
    if (error)
        return <messageError_1.default error={error}/>;
    if (data) {
        const { uploadFrameSide } = data;
        return (<div>
				<img src={uploadFrameSide.url} style={{ width: '100%' }}/>
			</div>);
    }
    const handleDrop = async (files) => {
        for (let i = 0; i < files.length; i++) {
            if (!files[i].name)
                return;
            fileList.push(files[i].name);
        }
        setFiles(fileList);
        await onFileSelect({
            target: {
                validity: {
                    valid: true,
                },
                files,
            },
        });
    };
    return (<div style={{ border: '1px dotted black' }}>
			<dragDrop_1.default handleDrop={handleDrop}>
				<div style={{
            minHeight: 300,
            minWidth: 650,
            display: 'flex',
            alignItems: 'center',
        }}>
					<input type="file" className={index_less_1.default.inputfile} id="file" required accept="image/jpg" onChange={onFileSelect}/>

					<label htmlFor="file" className={index_less_1.default.fileUploadLabel}>
						<uploadIcon_1.default />
						Upload frame photo
					</label>

					{fileList.map((file, i) => (<div key={i}>{file}</div>))}
				</div>
			</dragDrop_1.default>
		</div>);
}
exports.default = UploadFile;
