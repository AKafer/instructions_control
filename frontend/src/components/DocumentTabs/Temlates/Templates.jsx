import React, { useEffect, useState } from 'react';
import styles from './Templates.module.css';
import useApi from '../../../hooks/useApi.hook';
import TemplateItem from '../components/TemplateItem/TemplateItem';
import ConfigItem from '../components/ConfigItem/ConfigItem';

const TEMPLATES_GROUPED = [
	{
		group: 'АИ Помощник',
		templates: [
			{ name: 'Перечень профессий освобожденных от первичного инструктажа', template: 'non_qualify_prof_list' },
			{ name: 'ИОТ Бланк', template: 'iot_blank' },
			{ name: 'Перечень СИЗ требующих обучения', template: 'requiring_training_siz_list' },
			{ name: 'Перечень стажирующихся работников', template: 'trainee_workers_list' },
			{ name: 'Программа вводного инструктажа', template: 'introductory_briefing_program' }
		]
	},
	{
		group: 'Персональные',
		templates: [
			{ name: 'Акт регистрации вводного инструктажа', template: 'act_reg_intro' },
			{ name: 'Акт регистрации вводного по ГО', template: 'act_reg_civil_def' },
			{ name: 'Акт регистрации первичного инструктажа', template: 'act_reg_primary' },
			{ name: 'Журнал вводного и первичного по ПБ', template: 'journal_intro_primary' },
			{ name: 'Лист ознакомления с ЛНА работником', template: 'lnna_ack' },
			{ name: 'ЛК СИЗ', template: 'lk_siz' },
			{ name: 'Приказ о стажировке', template: 'order_internship' },
			{ name: 'Стажировочный лист', template: 'internship_sheet' }
		]
	},
	{
		group: 'Для организации',
		templates: [
			{ name: 'Журнал вводного и первичного по ПБ', template: 'journal_intro_primary' },
			{ name: 'Журнал Реестр учета микроповреждений', template: 'journal_microdamage' },
			{ name: 'Журнал учета несчастных случаев', template: 'journal_accidents' },
			{ name: 'ИОТ-ОППП-01 Первая помощь', template: 'iot_first_aid' },
			{ name: 'ИОТ-СИЗ-04 СИЗ', template: 'iot_siz' },
			{ name: 'Перечень инструкций', template: 'list_instructions' },
			{ name: 'Положение об обеспечении СИЗ', template: 'policy_siz' },
			{ name: 'Положение о несчастных случаях', template: 'policy_accidents' },
			{ name: 'Положение о порядке обучения ОТ', template: 'policy_training' },
			{ name: 'Положение о СУОТ', template: 'policy_suot' },
			{ name: 'Приказ об утверждении ЛНА по ОТ', template: 'order_approve_lna' },
			{ name: 'Приказ о сан постах', template: 'order_san_posts' },
			{ name: 'Приказ о старте новой СУОТ', template: 'order_start_suot' },
			{ name: 'Приказ ответственный за ОТ', template: 'order_responsible_ot' },
			{ name: 'Программа обучения по использованию СИЗ', template: 'program_siz_usage' },
			{ name: 'Программа обучения по общим вопросам СУОТ', template: 'program_general_suot' },
			{ name: 'Программа обучения по оказанию первой помощи', template: 'program_first_aid' },
			{ name: 'Программа обучения при воздействии вредных и опасных факторов', template: 'program_hazard_factors' },
			{ name: 'Программа стажировки на рабочем месте', template: 'program_workplace_internship' }
		]
	}
];

export function Templates() {
	const api = useApi();
	const [files, setFiles] = useState([]); // ответ от бэка — массив объектов {id, file_name, link}
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
