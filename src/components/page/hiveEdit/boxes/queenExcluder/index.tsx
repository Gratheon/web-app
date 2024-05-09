import React from 'react';
import style from './style.less';

export default function QueenExcluder({selected=false }) {
	return (
		<div className={`${style.excluder} ${selected && style.selected}`}></div>
	);
}