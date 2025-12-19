import styles from './SimpleListFromDB.module.css';
import {useState} from 'react';
import cn from 'classnames';
import useApi from '../../../../hooks/useApi.hook';
import {Textarea} from '../../../textarea/Textarea';
import Spinner from '../../../Spinner/Spinner';
import Button from '../../../Button/Button';

export function SimpleListFromDB({
	Title, getListUrl, downloadUrl, formatExempt=null
}) {
	const api = useApi();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [resultRequest, setResultRequest] = useState('');

	const handleRequest = async () => {
		setError(undefined);
		setLoading(true);

		try {
			const { data } = await api.post(
				getListUrl,
				{ all_db_items: true }
			);

			if (data?.exempt) {
				const exempt = data.exempt;

				if (typeof formatExempt === 'function') {
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
				downloadUrl,
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
			<h1 className={styles['title']}>{Title}</h1>
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
			{error && <div className={styles['error']}>{error}</div>}
		</>
	);
}
