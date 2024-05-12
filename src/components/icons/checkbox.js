import React from 'react'

export default function Checkbox({ size = 14, onClick = () => { }, strokeWidth = 10, color = "white", on=true}) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <g id="Free-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
                <g transform="translate(-747.000000, -526.000000)" id="Group" stroke={color} stroke-width="2">
                    <g transform="translate(745.000000, 524.000000)" id="Shape">
                        <path d="M5.16000009,3 L18.8399999,3 C20.032935,3 21,3.96706498 21,5.16000009 L21,18.8399999 C21,20.032935 20.032935,21 18.8399999,21 L5.16000009,21 C3.96706498,21 3,20.032935 3,18.8399999 L3,5.16000009 C3,3.96706498 3.96706498,3 5.16000009,3 Z">
                        </path>

                        {on && <polyline points="7 11.5593959 11.1176466 15.5 17 8.5"></polyline>}
                    </g>
                </g>
            </g>
        </svg>)
}