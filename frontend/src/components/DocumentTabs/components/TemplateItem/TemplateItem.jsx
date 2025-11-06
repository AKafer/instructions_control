import React, { useRef, useState } from 'react';
import styles from './TemplateItem.module.css';
import Button from '../../../Button/Button';

export default function TemplateItem({ index, name, templateKey, fileInfo, onUploaded, api }) {
	const inputRef = useRef(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [uploadedOk, setUploadedOk] = useState(false); // флаг успешной загрузки для UI

	const hasFile = Boolean(fileInfo?.link);
	const downloadLink = fileInfo?.link;

	const onChooseFile = () => {
		setError(undefined);
		inputRef.current?.click();
	};

	const showSuccess = (ms = 1500) => {
		setUploadedOk(true);
		setTimeout(() => setUploadedOk(false), ms);
	};

	const onFileChange = async (e) => {
		setError(undefined);
		const file = e.target.files?.[0];
		e.target.value = ''; // очистить input
		if (!file) return;

		const fd = new FormData();
		fd.append('file', file);
		fd.append('title', templateKey);

		setLoading(true);
		try {
			await api.post('/file_templates/', fd, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			if (onUploaded) await onUploaded();
			showSuccess(1500);
		} catch (err) {
			setError(err?.response?.data?.detail || err?.message || 'Ошибка при загрузке файла');
		} finally {
			setLoading(false);
		}
	};

	const renderButtonText = () => {
		if (loading) return 'Загрузка…';
		if (uploadedOk) return '✓ Загружен';
		return hasFile ? 'Заменить' : 'Загрузить';
	};

	return (
		<tr className={styles.row}>
			<td className={styles.cellIndex}>{index}</td>
			<td className={styles.cellName}>{name}</td>
			<td className={styles.cellFile}>
				{hasFile ? (
					<a href={downloadLink} target="_blank" rel="noreferrer" className={styles.fileLink}>
						<img src="/icons/doc-icon.svg" alt="file" className={styles.iconActive} />
					</a>
				) : (
					<div className={styles.fileLinkDisabled} title="Файл не загружен">
						<img src="/icons/doc-icon.svg" alt="file" className={styles.iconDisabled} />
					</div>
				)}
			</td>
			<td className={styles.cellAction}>
				<input ref={inputRef} type="file" onChange={onFileChange} className={styles.hiddenInput} />
				<Button
					onClick={onChooseFile}
					disabled={loading}
					className={`${styles.uploadBtn} ${uploadedOk ? styles.uploadedOkBtn : ''}`}
				>
					{renderButtonText()}
				</Button>
				{error && <div className={styles.error}>{error}</div>}
			</td>
		</tr>
	);
}
