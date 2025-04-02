import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

export function Modal({ isOpen, onClose, children }) {
	if (!isOpen) {
		return null;
	}

	return ReactDOM.createPortal(
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeBtn} onClick={onClose}>
          			&times;
				</button>
				{children}
			</div>
		</div>,
		document.body
	);
}
