import CopyIcon from "../../icons/copy.tsx";
import Button from "../button";
import T from "../translate";
import CopySuccess from "../../icons/copySuccess.tsx";
import { useState } from "react";

export default function CopyButton({ size = '', data = '' }) {
	let [copied, setCopied] = useState(false);
	const copyToken = (token: string) => {
		navigator.clipboard.writeText(token);
		setCopied(true)
	};

	return (
		<Button size={size} onClick={() => copyToken(data)}>
			{copied && <CopySuccess />}
			{!copied && <CopyIcon size={16} />}
			<T>Copy</T>
		</Button>
	)
}