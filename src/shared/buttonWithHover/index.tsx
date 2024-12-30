import { useState } from "react";
import Button from "../button";

export default function ButtonWithHover({ children, loading, icon, onClick, color = 'black', }) {
	let [isVisible, setVisible] = useState(false);

	return (
		<Button
			loading={loading}
			onClick={onClick}
			color={color}
			title={children}
			onMouseOver={() => {
				setVisible(true);
			}}
			onMouseOut={() => {
				setVisible(false);
			}}
			iconOnly={!isVisible}>
				{icon}
				{isVisible && children}
		</Button>
	);
}