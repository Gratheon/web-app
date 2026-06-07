declare module '*.less' {
	const resource: { [key: string]: string }
	export = resource
}

declare module 'onnxruntime-web/wasm' {
	export * from 'onnxruntime-web'
}
