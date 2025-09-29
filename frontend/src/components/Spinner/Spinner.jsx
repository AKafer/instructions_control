import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import styles from './Spinner.module.css';

export default function Spinner({
	showSeconds = false,
	startFrom = 0,
	pause = false,
	className
}) {
	const [sec, setSec] = useState(startFrom);
	const timerRef = useRef(null);

	useEffect(() => {
		if (!showSeconds || pause) return;
		timerRef.current = setInterval(() => setSec(s => s + 1), 1000);
		return () => clearInterval(timerRef.current);
	}, [showSeconds, pause]);

	return (
		<div className={cn(styles.wrap, className)} role="status" aria-live="polite">
			<div className={styles.spinner} />
			{showSeconds && <div className={styles.timer}>{sec}s</div>}
		</div>
	);
}

