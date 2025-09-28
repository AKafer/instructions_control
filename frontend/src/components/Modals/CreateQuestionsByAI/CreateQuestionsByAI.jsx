import styles from './CreateQuestionsByAI.module.css';
import {useCallback, useMemo, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import useApi from '../../../hooks/useApi.hook';
import Button from '../../Button/Button';
import {Textarea} from '../../textarea/Textarea';
import QuestionItem from '../../QuestionItem/QuestionItem';
import Spinner from '../../Spinner/Spinner';


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
	const [attachLoading, setAttachLoading] = useState(false);
	const [attachedOk, setAttachedOk] = useState(false);

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

	const attachSelectedToTest = useCallback(async () => {
		setError(undefined);

		if (!selectedTestOption?.value) {
			setError('Выберите тест.');
			return;
		}
		if (!selectedIds.size) {
			setError('Выберите хотя бы один вопрос.');
			return;
		}

		const testId = Number(selectedTestOption.value);

		const picked = questions
			.filter(q => selectedIds.has(q.id))
			.map(q => ({
				question: String(q.question ?? ''),
				answers: (Array.isArray(q.answers) ? q.answers : [])
					.filter(a => a && a.id != null && a.text != null)
					.map(a => ({
						id: String(a.id),
						text: String(a.text ?? '')
					})),
				correct_answer: Number(q.correct_answer_id),
				test_id: testId
			}));

		if (!picked.length) {
			setError('Нет выбранных вопросов для отправки.');
			return;
		}

		setAttachLoading(true);
		try {
			await api.post('/tests/questions/bulk_create', { questions: picked });
			setAttachedOk(true);
			setTimeout(() => setAttachedOk(false), 1000);
		} catch (e) {
			const msg = e?.response?.data?.detail || e?.message || 'Ошибка при сохранении вопросов';
			setError(msg);
		} finally {
			setAttachLoading(false);
		}
	}, [api, questions, selectedIds, selectedTestOption]);



	const errorMessage = 'Обязательное поле';
	const isDisabled = !someSelected || !selectedTestOption || loading;
	return (
		<>
			<div className={styles['create_questions']}>
				<h1 className={styles['title']}>Создание вопросов для теста</h1>
				{error && <div className={styles['error']}>{error}</div>}
				<div className={styles['content']} >
					<div className={styles['left_panel']}>
						<div className={styles['span']}>
						Текст инструкции:
							<Textarea
								text={promptText}
								setText={setPromptText}
								placeholder="Введите текст для генерации вопросов"
								disabled={loading}
								className={styles['textarea']}
							/>
						</div>
						<div className={styles['genButton']}>
							<Button
								onClick={sendToLLM}
								disabled={loading}
								className={styles.actionBtn}
							>
							Сгенерировать
							</Button>
						</div>
					</div>

					<div className={styles['right_panel']}>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipProf"
						>
						Тест:
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
						<div className={styles['question_title']}>
							<strong>Вопросы</strong>
							<label className={styles['checkbox_select_all']}>
								<input
									type="checkbox"
									checked={selectAll}
									onChange={toggleAll}
								/>
              						Выбрать все
							</label>
						</div>

						<div className={styles.quetions_box} aria-busy={loading}>
							{loading ? (
								<div className={styles.loaderWrap}>
									<Spinner />
								</div>
							) : questions.length === 0 ? (
								<div className={styles.empty_box}>Список пуст. Сгенерируйте вопросы.</div>
							) : (
								questions.map((q) => (
									<QuestionItem
										key={q.id}
										question={q}
										checked={selectedIds.has(q.id)}
										onToggle={() => toggleOne(q.id)}
									/>
								))
							)}
						</div>

						<div className={styles['testButton']}>
							<Button
								onClick={attachSelectedToTest}
								disabled={isDisabled}
								className={styles.actionBtn}
							>
								{attachedOk ? '✓ Добавлено' : (attachLoading ? 'Сохранение…' : 'Включить в тест')}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}