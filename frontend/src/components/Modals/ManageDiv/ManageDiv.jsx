import styles from './ManageDiv.module.css';
import Button from '../../Button/Button';
import {getAllDivisionsUrl} from '../../../helpers/constants';
import {useEffect, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {formReducer, INITIAL_STATE} from './manageDiv.state';
import useApi from '../../../hooks/useApi.hook';


export function ManageDiv({optionsDiv, setManageDivModalOpen, getDivisions, setSelectedDivOption}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const api = useApi();
	const {
		valueDiv,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;

	const optionsDivWide = [
		{value: 0, label: '---Создать новое подразделение---'},
		...optionsDiv
	];

	const manageDivApi = async (payload, isDelete = false) => {
		try {
			if (valueDiv) {
				if (isDelete) {
					await api.delete(`${getAllDivisionsUrl}${valueDiv}`);
				} else {
					await api.patch(`${getAllDivisionsUrl}${valueDiv}`, payload);
				}
			} else {
				await api.post(`${getAllDivisionsUrl}`, payload);
			}
			setManageDivModalOpen(false);
			getDivisions();
			setSelectedDivOption(null);
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const selectDiv = (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
		dispatchForm({type: 'SET_VALUE_Div', payload: option.value});
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

	const creatEditDiv = () => {
		dispatchForm({type: 'SUBMIT'});
	};

	const deleteDiv = () => {
		manageDivApi({}, true);
		dispatchForm({ type: 'CLEAR' });
		dispatchForm({type: 'SET_VALUE_Div', payload: 0});
	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			manageDivApi(values);
			dispatchForm({ type: 'CLEAR' });
			dispatchForm({type: 'SET_VALUE_Div', payload: 0});
		}
	}, [isFormReadyToSubmit, values, errors, isValid]);

	return (
		<div className={styles['manage_div']}>
			<h1 className={styles['title']}>Управление подразделениями</h1>
			{errorApi && <div className={styles['error']}>{errorApi}</div>}
			<div className={styles['content']}>
				<span className={styles['span']}>
					Подразделения:
					<SelectForm
						value={optionsDivWide.find(option => option.value === valueDiv)}
						options={optionsDivWide}
						name="Division_id"
						onChange={selectDiv}
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
								value={values.description ?? ''}
								type="text"
								name="description"
								placeholder="Описание"
								onChange={onChange}
							/>
						</span>
						<div className={styles['button-box']}>
							{(Boolean(valueDiv) && visibleDelButton) && <div className={styles['inline']}>
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
								<Button className={styles.button_submodal} onClick={deleteDiv}>
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
				<Button onClick={creatEditDiv}>
					{valueDiv ? 'Редактировать' : 'Создать'}
				</Button>
			</div>
		</div>
	);
}
