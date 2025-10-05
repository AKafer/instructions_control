import styles from './ManageTests.module.css';
import Button from '../../Button/Button';

import React, { useEffect, useReducer, useState } from 'react';
import { SelectForm } from '../../SelectForm/SelectForm';
import { Tooltip } from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import useApi from '../../../hooks/useApi.hook';
import { nullTestOption, INITIAL_STATE, formReducer } from './ManageTests.state';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import { getAllInstructionsUrl, getAllTestsUrl } from '../../../helpers/constants';
import QuestionItem from '../../QuestionItem/QuestionItem';

export function ManageTests({optionsTests, getTests}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [successInfo, setSuccessInfo] = useState({ show: false, text: '' });
	const [pendingInsId, setPendingInsId] = useState(null);
	const optionsTestsWide = [nullTestOption, ...optionsTests];
	const [testQuestions, setTestQuestions] = useState([]);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [newQ, setNewQ] = useState({
		question: '',
		answers: [
			{ id: 1, text: '' },
			{ id: 2, text: '' },
			{ id: 3, text: '' },
			{ id: 4, text: '' }
		],
		correct: 1
	});

	const closeAdd = () => setAddModalOpen(false);

	const openCloseSubModal = () => setAddModalOpen(prev => !prev);

	const onChangeNewQText = (e) => {
		setNewQ(prev => ({ ...prev, question: e.target.value }));
	};

	const onChangeAnsText = (idx, val) => {
		setNewQ(prev => {
			const answers = [...prev.answers];
			answers[idx] = { ...answers[idx], text: val };
			return { ...prev, answers };
		});
	};

	const onChangeCorrect = (val) => {
		setNewQ(prev => ({ ...prev, correct: Number(val) }));
	};

	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const {
		valueTest,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;

	const {
		error: errorIns,
		options: optionsIns,
		loading: loadingIns
	} = useFillSelect({
		endpoint: getAllInstructionsUrl,
		labelField: 'title'
	});

	const api = useApi();

	const hydrateFromDetails = (details) => {
		const { id, title, description, success_rate, instruction_id } = details || {};
		const found = [nullTestOption, ...optionsTests].find(o => String(o.value) === String(id));
		dispatchForm({ type: 'SET_VALUE_TEST', payload: found ?? { value: id, label: title } });
		dispatchForm({
			type: 'SET_VALUE',
			payload: {
				title: title ?? '',
				description: description ?? '',
				success_rate: (success_rate ?? '') === '' ? '' : String(success_rate)
			}
		});
		dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: true });
		setPendingInsId(instruction_id ?? null);
		const qs = Array.isArray(details?.questions)
			? details.questions.map(q => ({ ...q, correct_answer_id: q.correct_answer }))
			: [];
		setTestQuestions(qs);
	};

	const selectTest = async (option) => {
		dispatchForm({ type: 'SET_VALUE_TEST', payload: option });
		dispatchForm({ type: 'RESET_VALIDITY' });
		setSuccessInfo({ show: false, text: '' });
		setPendingInsId(null);

		if (option?.value && option.value !== 0) {
			try {
				const { data } = await api.get(`${getAllTestsUrl}/${option.value}`);
				hydrateFromDetails(data);
			} catch (e) {
				setTestQuestions([]);
				dispatchForm({
					type: 'SET_VALUE',
					payload: { title: option.label }
				});
				dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: true });
				setErrorApi(
					e.response?.data?.detail ||
          e.response?.data?.message ||
          `Неизвестная ошибка: ${e.message}`
				);
			}
		} else {
			setTestQuestions([]);
			dispatchForm({ type: 'CLEAR' });
			dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: false });
		}
	};

	useEffect(() => {
		if (!pendingInsId || loadingIns) return;
		const opt = optionsIns.find(o => String(o.value) === String(pendingInsId));
		if (opt) {
			dispatchForm({ type: 'SET_VALUE', payload: { valueIns: opt } });
			setPendingInsId(null);
		}
	}, [pendingInsId, loadingIns, optionsIns]);

	const selectIns = (option) => {
		dispatchForm({ type: 'SET_VALUE', payload: { valueIns: option } });
		dispatchForm({ type: 'RESET_VALIDITY' });
	};

	const onChange = (e) => {
		dispatchForm({ type: 'SET_SUB_MODAL', payload: false });
		dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: Boolean(valueTest?.value) });
		dispatchForm({ type: 'SET_VALUE', payload: { [e.target.name]: e.target.value } });
		dispatchForm({ type: 'RESET_VALIDITY' });
		setSuccessInfo({ show: false, text: '' });
	};

	const onChangeSuccessRate = (e) => {
		const v = e.target.value;
		if (v === '') {
			dispatchForm({ type: 'SET_VALUE', payload: { success_rate: '' } });
			return;
		}
		if (/^\d{1,3}$/.test(v)) {
			dispatchForm({ type: 'SET_VALUE', payload: { success_rate: v } });
		}
		setSuccessInfo({ show: false, text: '' });
	};

	const createEditTest = () => {
		dispatchForm({ type: 'SUBMIT' });
	};

	const manageTestsApi = async (payload) => {
		try {
			let response;
			const testId = valueTest?.value;

			if (testId && testId !== 0) {
				response = await api.patch(`${getAllTestsUrl}/${testId}`, payload);
			} else {
				response = await api.post(getAllTestsUrl, payload);
			}
			getTests();
			if (response) {
				const { id, title, description, success_rate, instruction_id } = response.data;
				const newOption = { value: id, label: title };
				dispatchForm({ type: 'SET_VALUE_TEST', payload: newOption });
				dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: true });
				dispatchForm({ type: 'RESET_VALIDITY' });
				dispatchForm({
					type: 'SET_VALUE',
					payload: {
						title: title ?? '',
						description: description ?? '',
						success_rate: (success_rate ?? '') === '' ? '' : String(success_rate)
					}
				});
				setPendingInsId(instruction_id ?? null);
			}

			setSuccessInfo({
				show: true,
				text: testId && testId !== 0 ? '✓ Отредактировано' : '✓ Добавлено'
			});
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail ||
      e.response?.data?.message ||
      `Неизвестная ошибка: ${e.message}`
			);
		}
	};


	useEffect(() => {
		if (!successInfo.show) return;
		const t = setTimeout(() => setSuccessInfo({ show: false, text: '' }), 1000);
		return () => clearTimeout(t);
	}, [successInfo.show]);

	useEffect(() => {
		if (isFormReadyToSubmit) {
			const payload = {
				title: String(values.title || '').trim(),
				description: values.description ?? '',
				success_rate: values.success_rate === '' ? null : Number(values.success_rate),
				instruction_id: values.valueIns?.value ?? null
			};
			manageTestsApi(payload);
			dispatchForm({ type: 'SET_SUBMIT_FALSE' });
		}
	}, [isFormReadyToSubmit]);

	const deleteTest = async () => {
		try {
			if (valueTest?.value) {
				await api.delete(`${getAllTestsUrl}/${valueTest.value}`);
			}

			dispatchForm({ type: 'CLEAR' });
			dispatchForm({ type: 'SET_VALUE_TEST', payload: nullTestOption });
			dispatchForm({ type: 'SET_SUB_MODAL', payload: false });
			dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: false });
			setTestQuestions([]);
			if (typeof getTests === 'function') {
				await getTests();
			}

			setSuccessInfo({ show: true, text: '✓ Удалено' });
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail ||
      e.response?.data?.message ||
      `Неизвестная ошибка: ${e.message}`
			);
		}
	};

	const addQuestion = async () => {
		if (!valueTest?.value) return;

		const qText = String(newQ.question || '').trim();
		const filledAnswers = newQ.answers
			.filter(a => String(a.text || '').trim() !== '')
			.map(a => ({ id: a.id, text: String(a.text).trim() }));

		if (!qText || filledAnswers.length < 3) {
			setErrorApi('Заполните текст вопроса и минимум 3 варианта ответа.');
			return;
		}
		if (newQ.correct < 1 || newQ.correct > filledAnswers.length) {
			setErrorApi('Номер верного варианта вне диапазона.');
			return;
		}

		const payload = {
			question: qText,
			answers: filledAnswers,
			correct_answer: newQ.correct,
			test_id: Number(valueTest.value)
		};

		try {
			await api.post('/tests/questions/', payload);
			setAddModalOpen(false);
			setNewQ({
				question: '',
				answers: [
					{ id: 1, text: '' },
					{ id: 2, text: '' },
					{ id: 3, text: '' },
					{ id: 4, text: '' }
				],
				correct: 1
			});

			if (typeof getTests === 'function') {
				await getTests(); // обновить список тестов у родителя
			}
			// подтянуть актуальные вопросы выбранного теста и обновить правую панель
			try {
				const { data } = await api.get(`${getAllTestsUrl}/${valueTest.value}`);
				hydrateFromDetails(data);
			} catch {}
		} catch (e) {
			setErrorApi(
				e?.response?.data?.detail ||
      e?.response?.data?.message ||
      `Неизвестная ошибка: ${e.message}`
			);
		}
	};


	useEffect(() => {
		const id = valueTest?.value;
		if (id == null) return;
		const opt = optionsTestsWide.find(o => String(o.value) === String(id));
		if (opt && opt !== valueTest) {
			dispatchForm({ type: 'SET_VALUE_TEST', payload: opt });
		}
	}, [optionsTests, valueTest?.value]);

	const deleteQuestion = async (qId) => {
		if (!qId) return;
		try {
			await api.delete(`/tests/questions/${qId}`);
			if (valueTest?.value) {
				const { data } = await api.get(`${getAllTestsUrl}/${valueTest.value}`);
				hydrateFromDetails(data); // обновит testQuestions
			}
			getTests();
		} catch (e) {
			setErrorApi(
				e?.response?.data?.detail ||
      e?.response?.data?.message ||
      `Неизвестная ошибка: ${e.message}`
			);
		}
	};

	return (
		<div className={styles['manage_activities']}>
			<h1 className={styles['title']}>Управление тестами</h1>
			{errorApi && (
				<div
					className={styles['error']}
					role="alert"
					tabIndex={0}
					onClick={() => setErrorApi(undefined)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') setErrorApi(undefined);
					}}
					title="Нажмите, чтобы скрыть"
				>
					{errorApi}
				</div>
			)}

			<div className={styles['content']}>
				<div className={styles['left_panel']}>
					<span className={styles['span']}>
            			Тесты:
						<SelectForm
							value={optionsTestsWide.find(o => String(o.value) === String(valueTest?.value)) || nullTestOption}
							options={optionsTestsWide}
							name="test_id"
							onChange={selectTest}
						/>
					</span>
					<div className={styles['box']}>
						<span className={styles['box-title']}>Параметры теста</span>
						<div className={styles['box-content']}>
							<span
								className={styles['span']}
								data-tooltip-content={errors.title}
								data-tooltip-id="errorTooltipTitleTest"
							>
                				Наименование*:
								<InputForm
									maxLength={64}
									value={values.title}
									isValid={isValid.title}
									type="text"
									name="title"
									placeholder="Наименование"
									onChange={onChange}
								/>
								<Tooltip
									id="errorTooltipTitleTest"
									place="top-end"
									content={errors.title}
									isOpen={!isValid.title}
									className={styles['my-tooltip']}
								/>
							</span>

							<span className={styles['span']}>
                			Описание:
								<InputForm
									value={values.description ?? ''}
									type="text"
									name="description"
									placeholder="Описание"
									onChange={onChange}
								/>
							</span>

							<span
								className={styles['span']}
								data-tooltip-content={errors.success_rate}
								data-tooltip-id="errorTooltipSuccessRate"
							>
                			Процент успешности* (0–100):
								<InputForm
									value={values.success_rate}
									isValid={isValid.success_rate}
									type="number"
									min={0}
									max={100}
									name="success_rate"
									placeholder="0–100"
									onChange={onChangeSuccessRate}
								/>
								<Tooltip
									id="errorTooltipSuccessRate"
									place="top-end"
									content={errors.success_rate}
									isOpen={!isValid.success_rate}
									className={styles['my-tooltip']}
								/>
							</span>
							<span
								className={styles['span']}
								data-tooltip-content={errors.instructions}
								data-tooltip-id="errorTooltipInstructions"
							>
                			Инструкции*:
								{loadingIns ? (
									<span>Загрузка инструкций...</span>
								) : (
									<>
										<SelectForm
											value={values.valueIns ?? null}
											placeholder="---Выберите инструкцию---"
											options={optionsIns}
											name="ins_id"
											onChange={selectIns}
										/>
										<Tooltip
											id="errorTooltipInstructions"
											place="top-end"
											content={errors.instructions}
											isOpen={!isValid.instructions}
											className={styles['my-tooltip']}
										/>
									</>
								)}
							</span>

							<div className={styles['button-box']}>
								{(!subModalOpen && Boolean(valueTest?.value) && visibleDelButton) ? (
									<div className={styles['inline']}>
										<button
											className={styles.iconButton}
											onClick={() => {
												dispatchForm({ type: 'SET_SUB_MODAL', payload: true });
												dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: false });
												setSuccessInfo({ show: false, text: '' });
											}}
										>
											<img className={styles.iconImage} src="/icons/delete-icon.svg" alt="delete" />
										</button>
									</div>
								) : (
									<div className={styles['inline']} />
								)}

								{subModalOpen && (
									<div className={styles['submodal']}>
										<Button className={styles.button_submodal} onClick={deleteTest}>
                                            Удалить
										</Button>
										<Button
											className={styles.button_submodal}
											onClick={() => {
												dispatchForm({ type: 'SET_SUB_MODAL', payload: false });
												dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: Boolean(valueTest?.value) });
											}}
										>
                      						Отмена
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className={styles['button']}>
						<Button onClick={createEditTest}>
							{successInfo.show
								? successInfo.text
								: (valueTest?.value ? 'Редактировать' : 'Создать')}
						</Button>
					</div>
				</div>

				<div className={styles['right_panel']}>
					<div className={styles['right_header']}>
						{Boolean(valueTest?.value) && (
							<button className={styles.iconButton} onClick={openCloseSubModal}>
								<img className={styles.iconImage} src="/icons/plus-icon.svg" alt="add" />
							</button>
						)}
					</div>

					{addModalOpen && (
						<div className={styles['submodal']}>
							<div className={styles['addq_box']}>
								<InputForm
									value={newQ.question}
									name="new_question"
									placeholder="Текст вопроса"
									onChange={onChangeNewQText}
								/>
								{newQ.answers.map((a, idx) => (
									<InputForm
										key={a.id}
										value={a.text}
										name={`answer_${a.id}`}
										placeholder={`Вариант ${a.id}`}
										onChange={(e) => onChangeAnsText(idx, e.target.value)}
									/>
								))}
								<span className={styles.span_small}>
										Верный ответ:
									<InputForm
										value={newQ.correct}
										type="number"
										min={1}
										max={4}
										name="correct_answer"
										placeholder="Номер верного (1–4)"
										onChange={(e) => onChangeCorrect(e.target.value)}
									/>
								</span>
							</div>
							<div className={styles['addq_actions']}>
								<Button className={styles.button_submodal} onClick={addQuestion}>
          								Добавить
								</Button>
							</div>
						</div>
					)}

					<div className={styles.questions_box}>
						{(!valueTest?.value || testQuestions.length === 0) ? (
							<div className={styles['empty_box']}>
								{valueTest?.value ? 'Список вопросов пуст.' : 'Выберите тест, чтобы посмотреть вопросы.'}
							</div>
						) : (
							testQuestions.map(q => (
								<QuestionItem
									key={q.id}
									question={q}
									showCheckbox={false}
									deletable
									onDelete={() => deleteQuestion(q.id)}
								/>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
