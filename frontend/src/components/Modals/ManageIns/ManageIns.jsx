import styles from './CreateIns.module.css';
import Button from '../../Button/Button';
import axios, {AxiosError} from 'axios';
import {
	getAllInstructionsUrl,
	JWT_STORAGE_KEY,
	PREFIX
} from '../../../helpers/constants';
import {useEffect, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {formReducer, INITIAL_STATE} from './CreateIns.state';


export function CreateIns({optionsIns, setManageInsModalOpen, getInstructions, setSelectedInsOption}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
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
	const optionsInsWide = [
		{value: 0, label: '---Создать новую инструкцию---'},
		...optionsIns
	];

	const manageInsApi = async (payload, isDelete = false) => {
		try {
			if (valueIns) {
				if (isDelete) {
					await axios.delete(`${PREFIX}${getAllInstructionsUrl}${valueIns}`,
						{
							headers: {
								'Authorization': `Bearer ${jwt}`,
								'Content-Type': 'application/json'
							}
						});
				} else {
					await axios.patch(`${PREFIX}${getAllInstructionsUrl}${valueIns}`,
						payload,
						{
							headers: {
								'Authorization': `Bearer ${jwt}`,
								'Content-Type': 'application/json'
							}
						});
				}
			} else {
				await axios.post(`${PREFIX}${getAllInstructionsUrl}`,
					payload,
					{
						headers: {
							'Authorization': `Bearer ${jwt}`,
							'Content-Type': 'application/json'
						}
					});
			}
			setManageInsModalOpen(false);
			getInstructions();
			// setSelectedInsOption(null);
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
		dispatchForm({type: 'SET_VALUE_Ins', payload: option.value});
		dispatchForm({type: 'RESET_VALIDITY'});
		if (option.value !== 0) {
			dispatchForm({
				type: 'SET_VALUE', payload:
					{
						'title': option.label,
						'description': option.description
					}}
			);
		} else {
			dispatchForm({type: 'CLEAR'});
		}
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
		dispatchForm({type: 'SET_VALUE_Ins', payload: 0});
	};

	useEffect(() => {
		console.log(state);
		if (isFormReadyToSubmit) {
			manageInsApi(values);
			dispatchForm({ type: 'CLEAR' });
			dispatchForm({type: 'SET_VALUE_Ins', payload: 0});
		}
	}, [isFormReadyToSubmit, values, errors, isValid]);

	return (
		<div className={styles['manage_ins']}>
			<h1 className={styles['title']}>Управление подразделениями</h1>
			{errorApi && <div className={styles['error']}>{errorApi}</div>}
			<div className={styles['content']}>
				<span className={styles['span']}>
					Подразделения:
					<SelectForm
						value={optionsInsWide.find(option => option.value === valueIns)}
						options={optionsInsWide}
						name="Instruction_id"
						onChange={selectIns}
					/>
				</span>
				<div className={styles['box']}>
					<span className={styles['box-title']}>Параметры подразделения</span>
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
						Описание:
							<InputForm
								value={values.description}
								type="text"
								name="description"
								placeholder="Описание"
								onChange={onChange}
							/>
						</span>
						<div className={styles['button-box']}>
							{(Boolean(valueIns) && visibleDelButton) && <div className={styles['inline']}>
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
					{valueIns ? 'Редактировать' : 'Создать'}
				</Button>
			</div>
		</div>
	);
};
