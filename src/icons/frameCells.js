import React from 'react'

export default function FrameCells({ size = 16, onClick = () => { }, strokeWidth = 10, color = "white", on = true }) {
	return (
		<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
			<path d="M 248.739 77.152 L 307.453 111.051 L 307.453 178.848 L 248.739 212.746 L 190.025 178.848 L 190.025 111.051 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(255, 225, 31);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
			<path d="M 366.113 80.411 L 424.827 114.31 L 424.827 182.106 L 366.113 216.005 L 307.399 182.107 L 307.399 114.309 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(255, 225, 31);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
			<path d="M 133.799 80.055 L 192.513 113.954 L 192.513 181.751 L 133.799 215.649 L 75.085 181.751 L 75.085 113.953 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(255, 225, 31);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
			<path d="M 192.207 180.544 L 250.921 214.443 L 250.921 282.24 L 192.207 316.138 L 133.493 282.24 L 133.493 214.443 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(88, 255, 46);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
			<path d="M 308.17 180.818 L 366.884 214.717 L 366.884 282.514 L 308.17 316.412 L 249.456 282.514 L 249.456 214.717 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(0, 185, 12);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)"  />
			<path d="M 251.658 283.305 L 310.372 317.203 L 310.372 385.001 L 251.658 418.899 L 192.944 385.001 L 192.944 317.203 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(0, 142, 19);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
			<path d="M 367.185 283.542 L 425.899 317.441 L 425.899 385.237 L 367.185 419.136 L 308.471 385.238 L 308.471 317.441 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(23, 159, 255);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
			<path d="M 136.718 286.209 L 195.432 320.107 L 195.432 387.905 L 136.718 421.803 L 78.004 387.905 L 78.004 320.107 Z" style="stroke-width: 13px; stroke-linecap: round; stroke-linejoin: round; stroke: rgb(0, 0, 0); fill: rgb(23, 159, 255);" transform="matrix(1, 0, 0, 1, 5.684341886080802e-14, 0)" />
		</svg>
	)
}