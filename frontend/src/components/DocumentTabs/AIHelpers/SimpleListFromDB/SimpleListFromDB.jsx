import styles from './SimpleListFromDB.module.css';
import React, {useState} from 'react';
import cn from 'classnames';
import useApi from '../../../../hooks/useApi.hook';
import {Textarea} from '../../../textarea/Textarea';
import Spinner from '../../../Spinner/Spinner';
import Button from '../../../Button/Button';
import {CustomSelect} from '../../../Select/Select';

export function SimpleListFromDB() {
	const api = useApi();
	const baseGetItemsUrl = '/documents/get_items/';
	const baseDownloadItemsUrl = '/documents/download_items/';
	const TEMPLATES = {
		non_qualify_prof_list: {
			itemName: 'profession',
			label: 'Перечень профессий освобожденных от первичного инструктажа'
		},
		trainee_workers_list: {
			itemName: 'profession',
			label: 'Перечень стажирующихся работников'
		},
		education_workers_list: {
			itemName: 'profession',
			label: 'Перечень профессий, требующих обучения по вопросам ОТ'
		},
		requiring_training_siz_list: {
			itemName: 'siz',
			label: 'Перечень СИЗ требующих обучения'
		}
	};

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [resultRequest, setResultRequest] = useState('');
	const [selectedTemplate, setSelectedTemplate] = useState(null);

	const templateOptions = Object.entries(TEMPLATES).map(([value, t]) => ({
		value,
		label: t.label
	}));

	const formatExempt = (exempt) =>
		(exempt || [])
			.map(({ profession, programs }) => `${profession}: ${(programs || []).join(', ')}`)
			.join('\n');


	const handleTemplateChange = (option) => {
		setSelectedTemplate(option);
		setResultRequest('');
		setError(undefined);
	};

	const handleRequest = async () => {
		setError(undefined);
		setLoading(true);
		const template = TEMPLATES[selectedTemplate.value];

		try {
			const { data } = await api.post(
				`${baseGetItemsUrl}${template.itemName}/${selectedTemplate.value}`,
				{ all_db_items: true }
			);

			if (data?.exempt) {
				const exempt = data.exempt;

				if (selectedTemplate.value === 'education_workers_list') {
					setResultRequest(formatExempt(exempt));
				} else if (Array.isArray(exempt) && exempt.every(v => typeof v === 'string')) {
					setResultRequest(exempt.join('\n'));
				} else {
					setError('Неподдерживаемый формат данных: передайте formatExempt(exempt).');
				}
			} else {
				setError('Не удалось получить список позиций.');
			}
		} catch (e) {
			const msg = e?.response?.data?.detail || e?.message || 'Ошибка при запросе к серверу';
			setError(msg);
			setResultRequest('');
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async () => {
		setError(undefined);
		setLoading(true);

		try {
			const items_list = resultRequest.split('\n').map(s => s.trim()).filter(Boolean);

			const response = await api.post(
				`${baseDownloadItemsUrl}${selectedTemplate.value}`,
				{ items_list: items_list },
				{ responseType: 'blob' }
			);

			const blob = new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'ListTemplateDocument.docx';
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			const msg = e?.response?.data?.detail || e?.message || 'Ошибка при запросе к серверу';
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className={styles.container}>
				{error && (
					<div className={styles.error} onClick={() => setError(undefined)}>
						{error} <span className={styles.errorClose}>✖</span>
					</div>
				)}
				<h1 className={styles.title}>Генератор списочных документов</h1>
				<CustomSelect
					className={styles.my_wider_select}
					value={selectedTemplate}
					options={templateOptions}
					placeholder="Тип документа"
					onChange={handleTemplateChange}
					width="100%"
				/>
				<div className={styles['span']}>
					<div className={styles['textarea-container']}>
						<Textarea
							text={resultRequest}
							setText={setResultRequest}
							placeholder="Результат будет показан здесь"
							disabled={false}
							className={styles['textarea']}
						/>
						{loading && (
							<div className={styles['spinner-overlay']}>
								<Spinner showSeconds={true} />
							</div>
						)}
					</div>
				</div>
				<div className={styles['buttons-container']}>
					<div className={styles['button']}>
						<Button onClick={handleRequest} disabled={loading}>
							{loading ? 'Запрос в обработке...' : 'Сформировать'}
						</Button>
					</div>
					<div className={styles['button']}>
						<Button
							onClick={handleDownload}
							disabled={!resultRequest}
							className={cn({ [styles.disabled]: !resultRequest })}
						>
					Выгрузить в файл
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
