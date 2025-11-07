import React, { useEffect, useRef, useState } from 'react';
import styles from './ConfigItem.module.css';
import Button from '../../../Button/Button';

export default function ConfigItem({
	displayIndex,
	item,
	initialKey = '',
	initialValue = '',
	api,
	onSaved,
	onDeleted
}) {
	const [keyVal, setKeyVal] = useState(initialKey);
	const [valueVal, setValueVal] = useState(initialValue);
	const [loadingSave, setLoadingSave] = useState(false);
	const [savedOk, setSavedOk] = useState(false);
	const [error, setError] = useState(undefined);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const mountedRef = useRef(true);

	useEffect(() => {
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		setKeyVal(initialKey);
		setValueVal(initialValue);
	}, [initialKey, initialValue]);

	const showSaved = (ms = 1500) => {
		setSavedOk(true);
		setTimeout(() => {
			if (mountedRef.current) setSavedOk(false);
		}, ms);
	};

	const handleSave = async () => {
		setError(undefined);
		setLoadingSave(true);
		try {
			await api.post('/config/item', {
				item,
				key: keyVal,
				value: valueVal
			});
			showSaved(1200);
			if (onSaved) await onSaved();
		} catch (e) {
			setError(e?.response?.data?.detail || e?.message || 'Ошибка при сохранении');
		} finally {
			if (mountedRef.current) setLoadingSave(false);
		}
	};

	const handleDelete = async () => {
		setError(undefined);
		setLoadingSave(true);
		try {
			await api.delete(`/config/item/${item}`);
			setConfirmOpen(false);
			if (onDeleted) await onDeleted();
		} catch (e) {
			setError(e?.response?.data?.detail || e?.message || 'Ошибка при удалении');
		} finally {
			if (mountedRef.current) setLoadingSave(false);
		}
	};

	return (
		<>
			<tr className={styles.row}>
				<td className={styles.cellIndex}>{displayIndex}</td>

				<td className={styles.cellKey}>
					<input
						type="text"
						value={keyVal}
						onChange={(e) => setKeyVal(e.target.value)}
						className={styles.input}
						placeholder="Ключ"
					/>
				</td>

				<td className={styles.cellValue}>
					<input
						type="text"
						value={valueVal}
						onChange={(e) => setValueVal(e.target.value)}
						className={styles.input}
						placeholder="Значение"
					/>
				</td>

				<td className={styles.cellSave}>
					<button
						className={`${styles.iconButton} ${savedOk ? styles.saved : ''}`}
						onClick={handleSave}
						disabled={loadingSave}
						title="Сохранить"
					>
						{savedOk ? (
							<img src="/icons/check-icon.svg" alt="ok" className={styles.icon} />
						) : (
							<img src="/icons/save-icon.svg" alt="save" className={styles.icon} />
						)}
					</button>
				</td>

				<td className={styles.cellDelete}>
					<div className={styles.deleteWrap}>
						<button
							className={styles.iconButton}
							onClick={() => setConfirmOpen((s) => !s)}
							title="Удалить"
							disabled={loadingSave}
						>
							<img src="/icons/delete-icon.svg" alt="delete" className={styles.icon} />
						</button>

						{confirmOpen && (
							<div className={styles.confirmPopup}>
								<div className={styles.confirmText}>Удалить элемент {item}?</div>
								<div className={styles.confirmButtons}>
									<Button className={styles.btnConfirm} onClick={handleDelete}>
                    Удалить
									</Button>
									<Button
										className={styles.btnCancel}
										onClick={() => setConfirmOpen(false)}
									>
                    Отмена
									</Button>
								</div>
							</div>
						)}
					</div>
				</td>
			</tr>

			{error && (
				<tr>
					<td colSpan={5} className={styles.rowError}>
						{error}
					</td>
				</tr>
			)}
		</>
	);
}
