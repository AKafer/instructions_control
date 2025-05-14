import styles from './ManageProf.module.css';
import Button from '../../Button/Button';
import {
	getAllProfessionsUrl,
	JWT_STORAGE_KEY
} from '../../../helpers/constants';
import {useEffect, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {formReducer, INITIAL_STATE} from './manageProf.state';
import useApi from '../../../hooks/useApi.hook';


export function ManageProf({optionsProf, setManageProfModalOpen, getProfessions, setSelectedProfOption}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const api = useApi();
	const {
		valueProf,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;

	const optionsProfWide = [
		{value: 0, label: '---Создать новую профессию---'},
		...optionsProf
	];

	const manageProfApi = async (payload, isDelete = false) => {
		try {
			if (valueProf) {
				if (isDelete) {
					await api.delete(`${getAllProfessionsUrl}${valueProf}`);
				} else {
					await api.patch(`${getAllProfessionsUrl}${valueProf}`, payload);
				}
			} else {
				await api.post(`${getAllProfessionsUrl}`, payload);
			}
			setManageProfModalOpen(false);
			getProfessions();
			setSelectedProfOption(null);
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const selectProf = (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
		dispatchForm({type: 'SET_VALUE_PROF', payload: option.value});
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

	const creatEditProf = () => {
		dispatchForm({type: 'SUBMIT'});
	};

	const deleteProf = () => {
		manageProfApi({}, true);
		dispatchForm({ type: 'CLEAR' });
		dispatchForm({type: 'SET_VALUE_PROF', payload: 0});
	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			manageProfApi(values);
			dispatchForm({ type: 'CLEAR' });
			dispatchForm({type: 'SET_VALUE_PROF', payload: 0});
		}
	}, [isFormReadyToSubmit, values, errors, isValid]);

	return (
		<div className={styles['manage_prof']}>
			<h1 className={styles['title']}>Управление профессиями</h1>
			{errorApi && <div className={styles['error']}>{errorApi}</div>}
			<div className={styles['content']}>
				<span className={styles['span']}>
					Профессии:
					<SelectForm
						value={optionsProfWide.find(option => option.value === valueProf)}
						options={optionsProfWide}
						name="profession_id"
						onChange={selectProf}
					/>
				</span>
				<div className={styles['box']}>
					<span className={styles['box-title']}>Параметры профессии</span>
					<div className={styles['box-content']}>
						<span
							className={styles['span']}
							data-tooltip-content={errors.title}
							data-tooltip-id="errorTooltipTitle"
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
							{(Boolean(valueProf) && visibleDelButton) && <div className={styles['inline']}>
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
								<Button className={styles.button_submodal} onClick={deleteProf}>
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
				<Button onClick={creatEditProf}>
					{valueProf ? 'Редактировать' : 'Создать'}
				</Button>
			</div>
		</div>
	);
};
