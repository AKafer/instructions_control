import styles from './CreateSIZ.module.css';
import Button from '../../Button/Button';
import {getAllMaterialsUrl} from '../../../helpers/constants';
import {useEffect, useMemo, useReducer, useState} from 'react';
import InputForm from '../../InputForm/InputForm';
import {SelectForm} from '../../SelectForm/SelectForm';
import {formReducer, INITIAL_STATE} from './CreateSIZ.state';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import useApi from '../../../hooks/useApi.hook';


export function CreateSIZ({
	optionsUser,
	userDict,
	optionsTypes,
	typesDict,
	setCreateModalOpen,
	setRefreshKey,
	currentSIZ
}) {
	const isEdit = Boolean(currentSIZ);
	const api = useApi();
	const [error, setError] = useState(undefined);
	const [formState, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const { values, isValid, isFormReadyToSubmit} = formState;
	const fio = (u) => [u.last_name, u.name, u.father_name].filter(Boolean).join(' ');

	const manageSIZ = async (payload) => {
		try {
			if (currentSIZ) {
				await api.patch(`${getAllMaterialsUrl}${currentSIZ.id}`, payload);
			} else{
				await api.post(`${getAllMaterialsUrl}`, payload);
			}
			setCreateModalOpen(false);
			setRefreshKey((prev) => prev + 1);
		} catch (e) {
			setError(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	useEffect(() => {
		if (currentSIZ) {
			dispatchForm({ type: 'SET_FROM_SIZ', payload: currentSIZ });
		}
	}, [currentSIZ]);

	const selectedUser = useMemo(() => {
		const id = values.user_id == null ? null : String(values.user_id);
		if (!id) return null;

		return (
			optionsUser.find(o => o.value === id) ||
    		(userDict[id] ? { value: id, label: fio(userDict[id]), description: userDict[id].description } : null)
		);
	}, [values.user_id, optionsUser, userDict]);

	const selectedType = useMemo(() => {
		const id = values.material_type_id == null ? null : String(values.material_type_id);
		if (!id) return null;

		return (
			optionsTypes.find(o => o.value === id) ||
			(typesDict[id] ? { value: id, label: String(typesDict[id].title || ''), description: typesDict[id].description } : null)
		);
	}, [values.material_type_id, optionsTypes, typesDict]);

	const onChange = (e) => {
		dispatchForm({type: 'SET_VALUE', payload: { [e.target.name]: e.target.value}});
		dispatchForm({type: 'SET_VALIDITY_FOR_FIELD', payload: e.target.name});
	};

	const selectUser = (e) => {
		dispatchForm({type: 'SET_VALUE', payload: { 'user_id': e.value}});
		dispatchForm({type: 'SET_VALIDITY_FOR_FIELD', payload: 'user_id'});
	};

	const selectType = (e) => {
		dispatchForm({type: 'SET_VALUE', payload: { 'material_type_id': e.value}});
		dispatchForm({type: 'SET_VALIDITY_FOR_FIELD', payload: 'material_type_id'});
	};

	const setNumber = (e, { min = 1, integer = true } = {}) => {
	  const name = e?.target?.name;
	  const raw =
		typeof e === 'number'
		  ? e
		  : e?.target?.valueAsNumber ?? Number(e?.target?.value ?? e?.value ?? e);

	  let num = Number.isFinite(raw) ? raw : NaN;

	  if (!Number.isFinite(num)) num = min;
	  if (integer) num = Math.floor(num);
	  if (num < min) num = min;

	  dispatchForm({ type: 'SET_VALUE', payload: { [name]: num } });
	  dispatchForm({ type: 'SET_VALIDITY_FOR_FIELD', payload: name });
	};

	const normalizeNumber = (e, { min = 1, integer = true } = {}) => {
		const name = e?.target?.name;
		let current = Number(values[name]);

		if (!Number.isFinite(current)) current = min;
		if (integer) current = Math.floor(current);
		if (current < min) current = min;

		dispatchForm({ type: 'SET_VALUE', payload: { [name]: current } });
	};

	const setStartDate = (e) => {
		const raw = e?.target?.value ?? e?.value ?? e;
		const val = (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw))
			? raw
			: new Date().toISOString().slice(0, 10);

		dispatchForm({ type: 'SET_VALUE', payload: { start_date: val } });
		dispatchForm({ type: 'SET_VALIDITY_FOR_FIELD', payload: 'start_date' });
	};

	const normalizeStartDate = (e) => {
		if (!e?.target?.value) {
			setStartDate('');
		}
	};

	const addSIZ = (e) => {
		e.preventDefault();
		dispatchForm({type: 'SUBMIT'});
	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			 const payload = {
				 ...values,
				 material_type_id: values.material_type_id != null ? Number(values.material_type_id) : null
			 };
			manageSIZ(payload);
			dispatchForm({ type: 'CLEAR' });
		}
	}, [isFormReadyToSubmit, values]);

	const errorMessage = 'Обязательное поле';

	return (
		<div className={styles['create_user']}>
			<h1 className={styles['title']}>{currentSIZ ? 'Редактировать' : 'Выдать'} материал</h1>
			{error && <div className={styles['error']}>{error}</div>}
			<form onSubmit={addSIZ} className={styles['form']}>
				<div className={styles['content']} >
					<div className={styles['left_panel']}>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipProf"
						>
						Сотрудник*:
							<SelectForm
								value={selectedUser}
								options={optionsUser}
								placeholder="Работник"
								name='user_id'
								onChange={selectUser}
								isValid={isValid.user_id}
								isDisabled={isEdit}
							/>
							<Tooltip
								id="errorTooltipProf"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.user_id}
								className={styles['my-tooltip']}
							/>
						</span>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipProf"
						>
						Тип материала*:
							<SelectForm
								value={selectedType}
								options={optionsTypes}
								placeholder="Тип материала"
								name='material_type_id'
								onChange={selectType}
								isValid={isValid.material_type_id}
								isDisabled={isEdit}
							/>
							<Tooltip
								id="errorTooltipProf"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.user_id}
								className={styles['my-tooltip']}
							/>
						</span>
						<span className={styles['span']}>
						Количество*, шт.:
							<InputForm
								value={values.quantity}
								type="number"
								name='quantity'
								min={1}                           // HTML-ограничение
    							step={1}
								placeholder='Количество'
								onChange={setNumber}
								onBlur={normalizeNumber}
							/>
						</span>
						<span className={styles['span']}>
  						Дата выдачи*:
							<InputForm
								value={values.start_date}
								type="date"
								name="start_date"
								placeholder="Дата выдачи"
								onChange={setStartDate}
								onBlur={normalizeStartDate}
							/>
						</span>
						<span className={styles['span']}>
						Период поверки, дней:
							<InputForm
								value={values.period}
								type="number"
								name='period'
								min={1}                           // HTML-ограничение
    							step={1}
								placeholder='Период поверки'
								onChange={setNumber}
								onBlur={normalizeNumber}
							/>
						</span>
						<span className={styles['span']}>
						Сертификат:
							<InputForm
								value={values.sertificate || ''}
								type="text"
								name='sertificate'
								placeholder='Сертификат'
								onChange={onChange}
							/>
						</span>

						<span className={styles['span']}>
						Номер документа:
							<InputForm
								value={values.number_of_document || ''}
								type="text"
								name='number_of_document'
								placeholder='Номер документа'
								onChange={onChange}
							/>
						</span>
					</div>
				</div>

				<div className={styles['button']}>
					<Button>{currentSIZ ? 'Редактировать' : 'Выдать'}</Button>
				</div>
			</form>
		</div>
	);
}