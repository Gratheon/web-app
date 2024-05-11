import { useState } from "react";
import Button from "../button";

export default function ButtonWithHover({ children, loading, onClick, title, color = 'black', }) {
	let [isVisible, setVisible] = useState(false);

	return (
		<div style="position:relative;">
			<Button
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
			</Button>
			{isVisible && <span style="position:absolute;left: 36px; font-size: 12px; text-shadow: 0.5px 0.5px white;">{title}</span>}
		</div>
	);
}