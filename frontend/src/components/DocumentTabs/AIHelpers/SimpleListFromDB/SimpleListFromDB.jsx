import styles from './SimpleListFromDB.module.css';
import React, {useState} from 'react';
import cn from 'classnames';
import useApi from '../../../../hooks/useApi.hook';
import {Textarea} from '../../../textarea/Textarea';
import Spinner from '../../../Spinner/Spinner';
import Button from '../../../Button/Button';
import {CustomSelect} from '../../../Select/Select';
import {TEMPLATES_BY_KEY} from '../../../../helpers/constants';
import Input from '../../../Input/Input';

export function SimpleListFromDB() {
	const api = useApi();
	const baseGetItemsUrl = '/documents/get_items/';
	const baseDownloadItemsUrl = '/documents/download_items/';

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [resultRequest, setResultRequest] = useState('');

	const [searchIndex, setSearchIndex] = useState(null);

	const TEMPLATE_KEYS = [
		'NON_QUALIFY_PROF_LIST',
		'TRAINEE_WORKERS_LIST',
		'EDUCATION_WORKERS_LIST',
		'REQUIRING_TRAINING_SIZ_LIST',
		'INTRODUCTORY_BRIEFING_PROGRAM',
		'NORMS_DSIZ_ISSUANCE'
	];

	const templateOptions = TEMPLATE_KEYS
		.map(key => ({
			value: key,
			label: TEMPLATES_BY_KEY[key]?.name ?? key
		}))
		.filter(Boolean);

	const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0]);

	const formatEduResponse = (exempt) =>
		(exempt || [])
			.map(({ profession, programs }) => `${profession}: ${(programs || []).join(', ')}`)
			.join('\n');

	const formatIntroResponse = (exempt) => {
		if (!exempt || typeof exempt !== 'object') return '';
		const risks = Array.isArray(exempt.risks) ? exempt.risks.filter(Boolean) : [];
		const factors = Array.isArray(exempt.factors) ? exempt.factors.filter(Boolean) : [];
		return `риски: ${risks.join(', ')};\n\nфакторы: ${factors.join(', ')}`;
	};

	const formatDsizResponse = (exempt) => {
		if (!exempt || typeof exempt !== 'object') return '';
		const with_primary = Array.isArray(exempt.with_primary) ? exempt.with_primary.filter(Boolean) : [];
		const shoe_size = Array.isArray(exempt.shoe_size) ? exempt.shoe_size.filter(Boolean) : [];
		return `список должностей с первичным: ${with_primary.join(', ')};\n\nсписок должностей СИЗ ног: ${shoe_size.join(', ')}`;
	};

	const handleTemplateChange = (option) => {
		setSelectedTemplate(option);
		setResultRequest('');
		setError(undefined);
	};

	const handleRequest = async () => {
		setError(undefined);
		setLoading(true);
		const templateMeta = TEMPLATES_BY_KEY[selectedTemplate.value];

		try {
			const { data } = await api.post(
				`${baseGetItemsUrl}${templateMeta.itemName}/${templateMeta.template}`,
				{
					search_index: searchIndex,
					all_db_items: true
				}
			);

			if (data?.exempt) {
				const exempt = data.exempt;

				if (selectedTemplate.value === 'EDUCATION_WORKERS_LIST') {
					setResultRequest(formatEduResponse(exempt));
				} else if (selectedTemplate.value === 'INTRODUCTORY_BRIEFING_PROGRAM') {
					setResultRequest(formatIntroResponse(exempt));
				} else if (selectedTemplate.value === 'NORMS_DSIZ_ISSUANCE') {
					setResultRequest(formatDsizResponse(exempt));
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
		const templateMeta = TEMPLATES_BY_KEY[selectedTemplate.value];

		try {
			const items_list = resultRequest.split('\n').map(s => s.trim()).filter(Boolean);
			const response = await api.post(
				`${baseDownloadItemsUrl}${templateMeta.template}`,
				{ items_list },
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
				<Input
					placeholder="Поисковый индекс"
					value={searchIndex}
					onChange={(e) => setSearchIndex(e.target.value)}
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
