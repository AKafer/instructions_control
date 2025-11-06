import React, { useEffect, useState } from 'react';
import styles from './Templates.module.css';
import useApi from '../../../hooks/useApi.hook';
import TemplateItem from '../components/TemplateItem/TemplateItem';

const TEMPLATES = [
	{ name: 'Перечень профессий освобожденных от первичного инструктажа', template: 'non_qualify_prof_list' },
	{ name: 'ИОТ Бланк', template: 'iot_blank' },
	{ name: 'Перечень СИЗ требующих обучения', template: 'requiring_training_siz_list' },
	{ name: 'Перечень стажирующихся работников', template: 'trainee_workers_list' },
	{ name: 'Программа вводного инструктажа', template: 'introductory_briefing_program' }
];

export function Templates() {
	const api = useApi();
	const [files, setFiles] = useState([]); // ответ от бэка — массив объектов {id, file_name, link}
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);

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
	}, []);

	const filesMap = Object.fromEntries((files || []).map((f) => [f.file_name, f]));

	return (
		<div className={styles.templates}>
			{error && <div className={styles.error}>{error}</div>}

			<table className={styles.table}>
				<thead>
					<tr>
						<th>#</th>
						<th>Название</th>
						<th>Файл</th>
						<th>Действие</th>
					</tr>
				</thead>
				<tbody>
					{TEMPLATES.map((tpl, idx) => (
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
				</tbody>
			</table>

			{loading && <div className={styles.loading}>Загрузка списка…</div>}
		</div>
	);
}

export default Templates;
