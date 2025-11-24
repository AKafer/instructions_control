import React, { useEffect, useState } from 'react';
import styles from './Templates.module.css';
import useApi from '../../../hooks/useApi.hook';
import TemplateItem from '../components/TemplateItem/TemplateItem';
import ConfigItem from '../components/ConfigItem/ConfigItem';
import {TEMPLATES_GROUPED} from '../../../helpers/constants';

export function Templates() {
	const api = useApi();
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [configItems, setConfigItems] = useState([]);

	const fetchFiles = async () => {
		setError(undefined);
		setLoading(true);
		try {
			const res = await api.get('/file_templates/');
			setFiles(Array.isArray(res?.data) ? res.data : []);
		} catch (e) {
			setError(e?.response?.data?.detail || e?.message || 'Ошибка при получении списка файлов');
			setFiles([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFiles();
		fetchConfig();
	}, []);

	const filesMap = Object.fromEntries((files || []).map((f) => [f.file_name, f]));

	const fetchConfig = async () => {
		try {
			const res = await api.get('/config/');
			const gp = res?.data?.global_placeholders || {};
			const arr = Object.entries(gp)
				.map(([k, v]) => ({
					item: Number(k),
					key: v?.key ?? '',
					value: v?.value ?? ''
				}))
				.sort((a, b) => a.item - b.item);
			setConfigItems(arr);
		} catch (e) {
			setConfigItems([]);
		}
	};

	const addPlaceholder = () => {
		const maxItem = configItems.length ? Math.max(...configItems.map(ci => ci.item)) : 0;
		const next = maxItem + 1;
		setConfigItems(prev => [...prev, { item: next, key: '', value: '' }].sort((a,b) => a.item - b.item));
	};

	return (
		<div className={styles.templates}>
			{error && <div className={styles.error}>{error}</div>}

			<div className={styles.container}>
				<div className={styles.tableBox}>
					<h2 className={styles.title}>Шаблоны</h2>

					{TEMPLATES_GROUPED.map((group) => (
						<div key={group.group} className={styles.tableGroup}>
							<div className={styles.groupTitle}>{group.group}</div>

							<table className={`${styles.table} ${styles.templatesTable}`}>
								<thead>
									<tr>
										<th>#</th>
										<th>Название</th>
										<th>Файл</th>
										<th>Действие</th>
									</tr>
								</thead>
								<tbody>
									{group.templates.map((tpl, idx) => (
										<TemplateItem
											key={tpl.template}
											index={idx + 1}
											name={tpl.name}
											templateKey={tpl.template}
											fileInfo={filesMap[tpl.template] ?? null}
											onUploaded={fetchFiles}
											api={api}
										/>
									))}
									{group.templates.length === 0 && (
										<tr>
											<td colSpan={4} style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--color_text_default_trans)' }}>
                        Нет шаблонов в этой группе
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					))}
				</div>

				<div className={styles.tableBox}>
					<h2 className={styles.title}>Конфиг</h2>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>#</th>
								<th>Плейсхолдер</th>
								<th>Значение</th>
								<th>Сохранить</th>
								<th>Удалить</th>
							</tr>
						</thead>
						<tbody>
							{configItems.map((c, idx) => (
								<ConfigItem
									key={c.item}
									displayIndex={idx + 1}
									item={c.item}
									initialKey={c.key}
									initialValue={c.value}
									api={api}
									onSaved={fetchConfig}
									onDeleted={fetchConfig}
								/>
							))}

							{configItems.length === 0 && (
								<ConfigItem
									key={'new-1'}
									displayIndex={1}
									item={1}
									initialKey={''}
									initialValue={''}
									api={api}
									onSaved={fetchConfig}
									onDeleted={fetchConfig}
								/>
							)}
						</tbody>
					</table>

					<div>
						<button
							className={styles.iconButton}
							onClick={addPlaceholder}
							title="Добавить плейсхолдер"
							disabled={false}
						>
							<img src="/icons/plus-icon.svg" alt="add" className={styles.icon} />
						</button>
					</div>
				</div>
			</div>

			{loading && <div className={styles.loading}>Загрузка списка…</div>}
		</div>
	);
}
