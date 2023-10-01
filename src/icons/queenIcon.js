import React from 'react'

export default function QueenIcon({ size = 20, className = '', onClick = () => {} }) {
	return <img src="/assets/bee-queen.png" className={className} height={size} width={size} onClick={onClick}/>
}