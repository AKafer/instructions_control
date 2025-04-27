import styles from './ManageIns.module.css';
import Button from '../../Button/Button';
import axios, {AxiosError} from 'axios';
import cn from 'classnames';
import {
	getAllInstructionsUrl,
	JWT_STORAGE_KEY,
	PREFIX
} from '../../../helpers/constants';
import {useEffect, useReducer, useRef, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {formReducer, INITIAL_STATE, nullOption} from './ManageIns.state';
import ToggleSwitch from '../../Switch/Switch';


export function ManageIns({optionsIns, instructionDict, setManageInsModalOpen, getInstructions}) {
	const inputRef = useRef(null);
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const optionsInsWide = [nullOption, ...optionsIns];
	const {
		valueIns,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;

	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	const manageInsApi = async (payload, isDelete = false) => {
		const data = new FormData();
		if (values) {
			data.append('file', values.file ?? '');
			data.append('title', values.title ?? '');
			data.append('number', values.number ?? '');
			data.append('iteration', values.repeatable ? 'true' : 'false');
			data.append('period', String(values.period ?? 0));
		}
		try {
			let response;
			if (valueIns?.value) {
				if (isDelete) {
					await axios.delete(`${PREFIX}${getAllInstructionsUrl}${valueIns?.value}`,
						{
							headers: {
								'Authorization': `Bearer ${jwt}`
							}
						});
				} else {
					response = await axios.patch(`${PREFIX}${getAllInstructionsUrl}${valueIns?.value}`,
						data,
						{
							headers: {
								'Authorization': `Bearer ${jwt}`
							}
						});
				}
			} else {
				response = await axios.post(`${PREFIX}${getAllInstructionsUrl}`,
					data,
					{
						headers: {
							'Authorization': `Bearer ${jwt}`
						}
					});
			}
			// setManageInsModalOpen(false);
			await getInstructions();
			if (response) {
				const { id, title, number, iteration, period, link } = response.data;
				const newOption = { value: id, label: title };
				dispatchForm({type: 'SET_VALUE_Ins', payload: newOption});
				dispatchForm({type: 'SET_SUB_MODAL', payload: false});
				dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
				dispatchForm({
					type: 'SET_VALUE', payload:
					{
						'title': title,
						'number': number || '',
						'repeatable': iteration || false,
						'period': period || '',
						'link': link || ''
					}}
				);

			}
		} catch (e) {
			if (e instanceof AxiosError) {
				setErrorApi(e.response?.data.detail || e.response?.data.message || 'Неизвестная ошибка');
			} else {
				setErrorApi(`Неизвестная ошибка ${e}`);
			}
		}
	};

	const selectIns = (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
		dispatchForm({type: 'SET_VALUE_Ins', payload: option});
		dispatchForm({type: 'RESET_VALIDITY'});
		if (option.value !== 0) {
			dispatchForm({
				type: 'SET_VALUE', payload:
					{
						'title': option.label,
						'number': instructionDict[option.value]?.number || '',
						'repeatable': instructionDict[option.value]?.iteration || false,
						'period': instructionDict[option.value]?.period || '',
						'link': instructionDict[option.value]?.link || ''
					}}
			);
		} else {
			dispatchForm({type: 'CLEAR'});
		}
	};

	const handleRepeatableChange = (field) => (checked) => {
		dispatchForm({ type: 'SET_SUB_MODAL', payload: false });
		dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: false });
		dispatchForm({ type: 'SET_VALUE', payload: { [field]: checked } });
		dispatchForm({ type: 'RESET_VALIDITY' });
	};

	const setFile = (e) => {
		dispatchForm({ type: 'SET_SUB_MODAL', payload: false });
		dispatchForm({ type: 'SET_VISIBLE_DEL_BUTTON', payload: false });
		const file = e.target.files[0];
		if (file) {
			dispatchForm({ type: 'SET_VALUE', payload: { file } });
		} else {
			dispatchForm({ type: 'SET_VALUE', payload: { file: null } });
		}
		e.target.value = '';
	};

	const onChange = (e) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});
		dispatchForm({type: 'SET_VALUE', payload: { [e.target.name]: e.target.value}});
		dispatchForm({type: 'RESET_VALIDITY'});
	};

	const creatEditIns = () => {
		dispatchForm({type: 'SUBMIT'});
	};

	const deleteIns = () => {
		manageInsApi({}, true);
		dispatchForm({ type: 'CLEAR' });
		dispatchForm({type: 'SET_VALUE_Ins', payload: nullOption});

	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			manageInsApi(values);
			dispatchForm({ type: 'CLEAR' });
			dispatchForm({type: 'SET_VALUE_Ins', payload: nullOption});
		}
	}, [isFormReadyToSubmit, values, errors, isValid]);

	return (
		<div className={styles['manage_ins']}>
			<h1 className={styles['title']}>Управление инструкциями</h1>
			{errorApi && <div className={styles.error}>{errorApi}</div>}
			<div className={styles['content']}>
				<span className={styles['span']}>
					Инструкции:
					<SelectForm
						value={valueIns}
						options={optionsInsWide}
						name="Instruction_id"
						onChange={selectIns}
					/>
				</span>
				<div className={styles.fileLinkBox}>
					<a
						href={values.link || undefined}
						target="_blank"
					    rel="noreferrer"
						className={cn(styles.fileLink, {
							[styles.disabled]: !values.link
						})}
					>
						<img
							className={styles.iconImageFile}
							src="/icons/doc-icon.svg"
							alt="Instruction file"/>
					</a>

				</div>
				<div className={styles['box']}>
					<span className={styles['box-title']}>Основные параметры инструкции</span>
					<div className={styles['box-content']}>
						<span
							className={styles['span']}
							data-tooltip-content={errors.title}
							data-tooltip-id="errorTooltipTitle"
						>
						Наименование*:
							<InputForm
								value={values.title}
								isValid={isValid.title}
								type="text"
								name="title"
								placeholder="Наименование"
								onChange={onChange}
							/>
							<Tooltip
								id="errorTooltipTitle"
								place="top-end"
								content={errors.title}
								isOpen={!isValid.title}
								className={styles['my-tooltip']}
							/>
						</span>
						<span className={styles['span']}>
						Номер:
							<InputForm
								value={values.number ?? ''}
								type="text"
								name="number"
								placeholder="Номер"
								onChange={onChange}
							/>
						</span>
						<div className={styles.switchBox}>
							<ToggleSwitch
								name="repeatable"
								checked={values.repeatable}
								onChange={handleRepeatableChange('repeatable')}
								size="default"
							/>

							{values.repeatable ? (
								<label className={styles.field}>
									<span className={styles.label}>Период, дней:</span>
									<InputForm
										value={values.period}
										type="number"
										name="period"
										placeholder="100"
										className={styles.input}
										onChange={onChange}
									/>
								</label>
							) : (
								<span className={styles.caption}>Повторяемость</span>
							)}
						</div>



						<div className={styles.fileButtonBox}>
							<input
								ref={inputRef}
								type="file"
								onChange={setFile}
								className={styles.hiddenInput}
							/>
							<Button
								className={styles.fileButton}
								onClick={() => inputRef.current?.click()}
							>
								{valueIns?.value ? 'Изменить ' : 'Выбрать '} файл
							</Button>
							<div className={styles.fileName}>{values.file?.name || 'файл не выбран'}</div>
						</div>
						<div className={styles['button-box']}>
							{(Boolean(valueIns?.value) && visibleDelButton) && <div className={styles['inline']}>
								<button className={styles.iconButton}
									onClick={() => {
										dispatchForm({type: 'SET_SUB_MODAL', payload: true});
										dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});
									}}
								>
									<img
										className={styles.iconImage}
										src="/icons/delete-icon.svg"
										alt="delete"/>
								</button>
							</div>}
							{subModalOpen && <div className={styles['submodal']}>
								<Button className={styles.button_submodal} onClick={deleteIns}>
										Удалить
								</Button>
								<Button className={styles.button_submodal} onClick={() => {
									dispatchForm({type: 'SET_SUB_MODAL', payload: false});
									dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
								}}>
										Отмена
								</Button>
							</div>
							}
						</div>
					</div>
				</div>
			</div>
			<div className={styles['button']}>
				<Button onClick={creatEditIns}>
					{valueIns?.value ? 'Редактировать' : 'Создать'}
				</Button>
			</div>
		</div>
	);
};
