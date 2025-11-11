import styles from './AIHelper.module.css';
import {useState} from 'react';
import Button from '../../Button/Button';
import {Textarea} from '../../textarea/Textarea';
import Spinner from '../../Spinner/Spinner';
import useApi from '../../../hooks/useApi.hook';
import cn from 'classnames';

export function AIHelper() {
	const api = useApi();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [resultRequest, setResultRequest] = useState('');

	const handleRequest = async () => {
		setError(undefined);
		setLoading(true);

		try {
			const { data } = await api.post(
				'/documents/non_qualify_prof_list',
				{ all_db_professions: true }
			);

			if (data?.exempt) {
				setResultRequest(data.exempt.join('\n'));
			} else {
				setError('Не удалось получить список профессий.');
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
			const profession_list = resultRequest.split('\n').map(s => s.trim()).filter(Boolean);

			const response = await api.post(
				'/documents/non_qualify_prof_list/download',
				{ profession_list },
				{ responseType: 'blob' }
			);

			const blob = new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'Non_qualify_prof_list.docx';
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
			<h1 className={styles['title']}>Профессии освобождаемые от инструктажа</h1>
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
