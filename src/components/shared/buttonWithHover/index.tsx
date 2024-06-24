import { useState } from "react";
import Button from "../button";

export default function ButtonWithHover({ children, loading, onClick, title, color = 'black', }) {
	let [isVisible, setVisible] = useState(false);

	return (
		<Button
			style="width: auto;"
			loading={loading}
			onClick={onClick}
			color={color}
			onMouseOver={() => {
				setVisible(true);
			}}
			onMouseOut={() => {
				setVisible(false);
			}}
		>
			{children}

			{isVisible && title}
		</Button>
	);
}