import styles from './CreateQuestionsByAI.module.css';
import {useCallback, useEffect, useMemo, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {formReducer, INITIAL_STATE} from './CreateQuestionsByAI.state';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import useApi from '../../../hooks/useApi.hook';
import Button from '../../Button/Button';


export function CreateQuestionsByAI({
	optionsTests,
	testsDict,
	setCreateModalOpen

}) {
	const api = useApi();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [selectedTestOption, setSelectedTestOption] = useState(null);
	const [promptText, setPromptText] = useState('');
	const [questions, setQuestions] = useState([]);
	const [selectedIds, setSelectedIds] = useState(new Set());

	const selectAll = useMemo(() => questions.length > 0 && selectedIds.size === questions.length, [questions, selectedIds]);
	const someSelected = useMemo(() => selectedIds.size > 0, [selectedIds]);

	const toggleOne = useCallback((id) => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const toggleAll = useCallback(() => {
		setSelectedIds(prev => {
			if (prev.size === questions.length) return new Set(); // снять всё
			return new Set(questions.map(q => q.id)); // выбрать всё
		});
	}, [questions]);

	const sendToLLM = useCallback(async () => {
		setError(undefined);
		setLoading(true);
		try {
			if (!promptText.trim()) {
				setError('Введите текст для генерации вопросов.');
				return;
			}
			const { data } = await api.post(
				'/tests/llm/questions',
				promptText,
				{ headers: { 'Content-Type': 'text/plain' } }
			);

			const qs = Array.isArray(data?.questions) ? data.questions : [];
			if (!qs.length) {
				setError('Ответ LLM не содержит вопросов (questions).');
				setQuestions([]);
				setSelectedIds(new Set());
				return;
			}
			setQuestions(qs);
			setSelectedIds(new Set(qs.map(q => q.id))); // по умолчанию выделить все
		} catch (e) {
			const msg = e?.response?.data?.detail || e?.message || 'Ошибка при запросе к LLM';
			setError(msg);
			setQuestions([]);
			setSelectedIds(new Set());
		} finally {
			setLoading(false);
		}
	}, [api, promptText]);

	const attachSelectedToTest = useCallback(() => {
		if (!selectedTestOption?.value) {
			setError('Выберите тест.');
			return;
		}
		if (!selectedIds.size) {
			setError('Выберите хотя бы один вопрос.');
			return;
		}
		const picked = questions.filter(q => selectedIds.has(q.id));
		// заглушка — тут сделай реальный POST на свой бэкенд
		// например: api.post(`/api/v1/tests/${selectedTestOption.value}/questions`, picked)
		// пока — просто уведомим:
		// eslint-disable-next-line no-alert
		alert(`Отправляем ${picked.length} вопрос(ов) в тест ID=${selectedTestOption.value}`);
	}, [questions, selectedIds, selectedTestOption]);


	const errorMessage = 'Обязательное поле';
	return (
		<div className={styles['create_user']}>
			<div>
				<h1 className={styles['title']}>Создание вопросов для теста</h1>
				{error && <div className={styles['error']}>{error}</div>}
				<span
					className={styles['span']}
					data-tooltip-content={errorMessage}
					data-tooltip-id="errorTooltipProf"
				>
				Тесты*:
					<SelectForm
						value={selectedTestOption}
						options={optionsTests}
						placeholder="Тесты"
						name='test_id'
						onChange={setSelectedTestOption}
					/>
					<Tooltip
						id="errorTooltipProf"
						place="top-end"
						content={errorMessage}
						isOpen={false}
						className={styles['my-tooltip']}
					/>
				</span>
				<div className={styles['span']}>
            Текст для генерации:
					<textarea
						value={promptText}
						placeholder="Вставьте сюда исходный текст, по которому LLM сгенерирует вопросы…"
						onChange={(e) => setPromptText(e.target.value)}
						disabled={loading}
						style={{
							width: '100%',
							minHeight: 180,
							resize: 'vertical',
							padding: 10,
							borderRadius: 8,
							border: '1px solid #ddd',
							font: 'inherit',
							boxSizing: 'border-box'
						}}
					/>
				</div>
				<Button onClick={sendToLLM}>
				Сгенерировать
				</Button>
			</div>

			{/* Правая колонка: вопросы с прокруткой и чекбоксами */}
			<div>
				<div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
					<strong>Вопросы</strong>
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
						<input
							type="checkbox"
							checked={selectAll}
							onChange={toggleAll}
						/>
              Выбрать все
					</label>
				</div>
				<div
					style={{
						maxHeight: 420,
						overflowY: 'auto',
						border: '1px solid #eee',
						borderRadius: 8,
						padding: 12
					}}
				>
					{questions.length === 0 ? (
						<div style={{ color: '#888' }}>Список пуст. Сгенерируйте вопросы.</div>
					) : (
						questions.map((q) => (
							<div
								key={q.id}
								style={{
									border: '1px solid #e5e5e5',
									borderRadius: 8,
									padding: 10,
									marginBottom: 10
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<input
										type="checkbox"
										checked={selectedIds.has(q.id)}
										onChange={() => toggleOne(q.id)}
									/>
									<div><strong>#{q.id}</strong> {q.question}</div>
								</div>
								<ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
									{Array.isArray(q.answers) && q.answers.map(a => (
										<li key={a.id} style={{ marginBottom: 2 }}>
											{a.id}. {a.text}
											{q.correct_answer_id === a.id && (
												<span style={{ marginLeft: 8, fontSize: 12, color: 'green' }}>
                            (верный)
												</span>
											)}
										</li>
									))}
								</ul>
							</div>
						))
					)}
				</div>

				<div style={{ marginTop: 12 }}>
					<button
						className={styles.buttonPrimary ?? undefined}
						type="button"
						onClick={attachSelectedToTest}
						disabled={!someSelected || !selectedTestOption || loading}
						style={{
							padding: '10px 14px',
							borderRadius: 8,
							border: 'none',
							cursor: (!someSelected || !selectedTestOption || loading) ? 'not-allowed' : 'pointer',
							opacity: (!someSelected || !selectedTestOption || loading) ? 0.6 : 1
						}}
					>
              Отправить выбранные вопросы в тест
					</button>
				</div>
			</div>
 
		</div>
	);
}