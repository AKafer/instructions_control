import styles from './ManageIns.module.css';
import Button from '../../Button/Button';
import cn from 'classnames';
import {
	getAllInstructionsUrl,
	getAllModulesUrl,
	getAllRulesUrl
} from '../../../helpers/constants';
import {useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {formReducer, INITIAL_STATE, nullOption} from './ManageIns.state';
import ToggleSwitch from '../../Switch/Switch';
import BindedProf from '../../BindedProf/BindedProf';
import {useNavigate} from 'react-router-dom';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import Module from '../../Module/Module';
import useApi from '../../../hooks/useApi.hook';


export function ManageIns({
	optionsIns,
	instructionDict,
	getInstructions,
	optionsProf
})
{
	const navigate = useNavigate();
	const inputRef = useRef(null);
	const inputModuleRef = useRef(null);
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const optionsInsWide = [nullOption, ...optionsIns];
	const [moduleTitle, setModuleTitle] = useState('');
	const [moduleFile, setModuleFile] = useState(null);
	const api = useApi();

	const {
		error: errorModule,
		options: optionsModule,
		itemDict: modulesDict,
		getItems: getModules
	} = useFillSelect({
		endpoint: getAllModulesUrl,
		labelField: 'description'
	});


	const {
		error: errorRule,
		options: optionsRule,
		itemDict: rulesDict,
		getItems: getRules
	} = useFillSelect({
		endpoint: getAllRulesUrl,
		labelField: 'description'
	});

	const {
		valueIns,
		valueProf,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;

	const profDict = useMemo(
		() => Object.fromEntries(optionsProf.map(({ value, label }) => [value, label])),
		[optionsProf]
	);

	const optionsUnBindedProf = useMemo(() => {
		if (valueIns?.value === 0) {
			return [];
		}

		return optionsProf.filter(option =>
			!Object.values(rulesDict).some(rule =>
				rule.instruction_id === valueIns?.value &&
      			rule.profession_id  === option.value
			)
		);
	}, [optionsProf, rulesDict, valueIns]);

	const currentInsModules = useMemo(() => {
		if (valueIns?.value === 0) {
			return [];
		}
		return Object
			.values(modulesDict)
			.filter(m => m.instruction_id === valueIns.value)
			.sort((a, b) => a.order_index - b.order_index);
	}, [valueIns, modulesDict]);

	const maxIndex = useMemo(() => {
		if (currentInsModules.length === 0) {
			return 0;
		}
		return Math.max(...currentInsModules.map(m => m.order_index));
	});

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
					await api.delete(`${getAllInstructionsUrl}${valueIns?.value}`);
				} else {
					response = await api.patch(`${getAllInstructionsUrl}${valueIns?.value}`, data);
				}
			} else {
				response = await api.post(`${getAllInstructionsUrl}`, data);
			}
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
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const manageRulesApi = async (method, payload, rule_id) => {
		try {
			if (method === 'POST') {
				await api.post(getAllRulesUrl, payload);
			} else if (method === 'DELETE') {
				await api.delete(`${getAllRulesUrl}${rule_id}`);
			}
			getRules();
			dispatchForm({ type: 'SET_VALUE_Prof', payload: null });
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const manageModulesApi = async (method, data, module_id) => {
		try {
			if (method === 'POST') {
				await api.post(`${getAllModulesUrl}`, data);
			}
			if (method === 'PATCH') {
				await api.patch(`${getAllModulesUrl}${module_id}`, data);
			}
			if (method === 'DELETE') {
				await api.delete(`${getAllModulesUrl}${module_id}`);
			}
			if (method === 'MOVE') {
				await api.post(`${getAllModulesUrl}${module_id}?move=${data.move}`,{});
			}
			getModules();
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const selectProf = (option) => {
		dispatchForm({type: 'SET_VALUE_Prof', payload: option});
	};

	const selectIns = (option) => {
		setModuleTitle('');
		setModuleFile(null);
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
						'link': instructionDict[option.value]?.link || '',
						'file': null
					}}
			);
			dispatchForm({type: 'SET_VALUE_Prof', payload: null});
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

	const bindProf = () => {
		const payload = {
			instruction_id: valueIns?.value,
			profession_id: valueProf?.value,
			description: `created by user on ${new Date().toLocaleDateString()}`
		};
		manageRulesApi('POST', payload);
	};

	const changeModuleTitle = (e) => {
		setModuleTitle(e.target.value);
	};

	const bindModule = () => {
		const data = new FormData();
		data.append('file', moduleFile ?? '');
		data.append('title', moduleTitle ?? '');
		data.append('instruction_id', valueIns?.value ?? '');
		data.append('description', `created by user on ${new Date().toLocaleDateString()}`);
		data.append('order_index', String(maxIndex + 1));
		console.log('bindModule', data);
		manageModulesApi('POST', data);
		setModuleFile(null);
		setModuleTitle('');
	};

	return (
		<div className={styles['manage_ins']}>
			<h1 className={styles.title}>Управление инструкциями</h1>
			{(errorApi || errorRule || errorModule) && <div className={styles.error}>
				Ошибка АПИ: {errorApi}-Ошибка загрузки привязок: {errorRule}-Ошибка загрузки модулей: {errorModule}
			</div>}
			<div className={styles['content']}>
				<div className={styles['left_panel']}>
					<h2 className={styles.title}>Основное</h2>
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
									maxLength={640}
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
									onClick={() => {

										inputRef.current?.click();
										dispatchForm({type: 'RESET_VALIDITY'});
									}}
								>
									{valueIns?.value ? 'Изменить ' : 'Выбрать '} файл
								</Button>
								<div
									className={cn(
										styles.fileName,
										{ [styles.red_text]: !isValid.file },
									)}
								>
									{values.file?.name || 'файл не выбран'}
								</div>
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
								{subModalOpen && <div className={styles.submodal}>
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
					<div className={styles['button']}>
						<Button onClick={creatEditIns}>
							{valueIns?.value ? 'Редактировать' : 'Создать'}
						</Button>
					</div>
				</div>
				<div className={styles['left_panel']}>
					<h2 className={styles.title}>Привязка профессий</h2>
					<span className={styles['span']}>
					Профессии:
						<SelectForm
							value={valueProf}
							placeholder={'Выберите профессию'}
							options={optionsUnBindedProf || []}
							name="Profession_id"
							onChange={selectProf}
						/>
					</span>
					<div className={styles.bind_button_box}>
						<Button
							className={cn(styles.bind_button, {
								[styles.disabled]: (!valueIns?.value || valueProf == null)
							})}
							onClick={bindProf}>
							Привязать
						</Button>
					</div>
					<div className={styles.binds_box}>
						{Object.values(rulesDict)
							.filter(rule => rule.instruction_id === valueIns?.value)  /* только нужные */
							.map(rule => (
								<BindedProf
									key={rule.id}
									rule_id={rule.id}
									profession_id={rule.profession_id}
									profDict={profDict}
									manageRulesApi={manageRulesApi}
								/>
							))}
					</div>
				</div>
				<div className={styles['right_panel']}>
					<h2 className={cn(styles.title, styles.moduleWitdth)}>Привязка модулей</h2>
					<span
						className={styles['span']}
					>
						Наименование*:
						<InputForm
							maxLength={64}
							value={moduleTitle}
							type="text"
							name="title"
							placeholder="Наименование"
							onChange={changeModuleTitle}
						/>
					</span>
					<div className={styles.fileButtonBox}>
						<input
							ref={inputModuleRef}
							type="file"
							onChange={(e) => {
								setModuleFile(e.target.files[0]);
								e.target.value = '';
							}}
							className={styles.hiddenInput}
						/>
						<Button
							className={cn(styles.fileButton, {
								[styles.disabled]: !( valueIns?.value)
							})}
							onClick={() => {
								inputModuleRef.current?.click();
							}}
						>
							Выбрать файл
						</Button>
						<div className={styles.fileName}>
							{moduleFile?.name || 'файл не выбран'}
						</div>
					</div>
					<div className={styles.bind_button_box}>
						<Button
							className={cn(styles.bind_button, {
								[styles.disabled]: !(Boolean(moduleTitle) && Boolean(moduleFile) && valueIns?.value)
							})}
							onClick={bindModule}>
							Привязать
						</Button>
					</div>
					<div className={styles.module_box}>
						{Object.values(currentInsModules).map((module, idx) => (
							<Module
								key={module.id}
								displayIndex={idx + 1}
								module={module}
								manageModulesApi={manageModulesApi}
							/>
						))}
					</div>
				</div>

			</div>
		</div>
	);
};
