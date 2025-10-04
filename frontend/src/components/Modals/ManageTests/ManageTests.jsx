import styles from './ManageTests.module.css';
import Button from '../../Button/Button';

import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { SelectForm } from '../../SelectForm/SelectForm';
import { Tooltip } from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import useApi from '../../../hooks/useApi.hook';
import { nullTestOption, INITIAL_STATE, formReducer } from './ManageTests.state';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import { getAllInstructionsUrl, getAllTestsUrl } from '../../../helpers/constants';

export function ManageTests({ optionsTests, getTests }) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [successInfo, setSuccessInfo] = useState({ show: false, text: '' });
	const [insError, setInsError] = useState('');
	const [pendingInsId, setPendingInsId] = useState(null);

	const optionsTestsWide = useMemo(() => [nullTestOption, ...optionsTests], [optionsTests]);

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

	const mergedTestOptions = useMemo(() => {
		const base = optionsTestsWide.slice();
		const v = valueTest?.value;
		if (v && !base.some(o => o.value === v)) {
			base.push(valueTest);
		}
		return base;
	}, [optionsTestsWide, valueTest]);

	const hydrateFromDetails = (details) => {
		const { id, title, description, success_rate, instruction_id } = details || {};
		dispatchForm({ type: 'SET_VALUE_TEST', payload: { value: id, label: title } });
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
	};

	const selectTest = async (option) => {
		dispatchForm({ type: 'SET_VALUE_TEST', payload: option });
		dispatchForm({ type: 'RESET_VALIDITY' });
		setSuccessInfo({ show: false, text: '' });
		setInsError('');
		setPendingInsId(null);

		if (option?.value && option.value !== 0) {
			try {
				const { data } = await api.get(`${getAllTestsUrl}/${option.value}`);
				hydrateFromDetails(data);
			} catch (e) {
				// fallback: хотя бы имя поставим
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
		setInsError('');
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
		if (!values?.valueIns?.value) {
			setInsError('Обязательное поле');
			return;
		}
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

			if (response?.data) {
				hydrateFromDetails(response.data);
			}

			if (typeof getTests === 'function') {
				await getTests();
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
	}, [isFormReadyToSubmit]); // eslint-disable-line react-hooks/exhaustive-deps

	const deleteTest = async () => {
		try {
			if (valueTest?.value) {
				await api.delete(`/tests/${valueTest.value}`);
			}
			if (typeof getTests === 'function') {
				await getTests();
			}
			dispatchForm({ type: 'CLEAR' });
			dispatchForm({ type: 'SET_VALUE_TEST', payload: nullTestOption });
			dispatchForm({ type: 'SET_SUB_MODAL', payload: false });
			dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: false });
			setSuccessInfo({ show: true, text: '✓ Удалено' });
			setInsError('');
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail ||
        e.response?.data?.message ||
        `Неизвестная ошибка: ${e.message}`
			);
		}
	};

	return (
		<div className={styles['manage_activities']}>
			<h1 className={styles['title']}>Управление тестами</h1>
			{errorApi && <div className={styles['error']}>{errorApi}</div>}

			<div className={styles['content']}>
				<div className={styles['left_panel']}>
					<span className={styles['span']}>
            Тесты:
						<SelectForm
							value={valueTest}
							options={mergedTestOptions}
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

							<span className={styles['span']}>
                Инструкции*:
								{loadingIns ? (
									<span>Загрузка инструкций...</span>
								) : (
									<SelectForm
										value={values.valueIns ?? null}
										placeholder="---Выберите инструкцию---"
										options={optionsIns}
										name="ins_id"
										onChange={selectIns}
									/>
								)}
								{(insError || errorIns) && (
									<div className={styles.error}>{insError || errorIns}</div>
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
			</div>
		</div>
	);
}
