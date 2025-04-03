import styles from './Users.module.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import {CustomSelect} from '../../../components/Select/Select';
import axios, {AxiosError} from 'axios';
import {JWT_STORAGE_KEY, PREFIX} from '../../../helpers/constants';
import {useEffect, useState} from 'react';

export function Users () {
	const [error, setError] = useState(undefined);
	const [optionsProf, setOptionsProf] = useState([]);
	const [optionsDiv, setOptionsDiv] = useState([]);
	const [selectedProfOption, setSelectedProfOption] = useState(null);
	const [selectedDivOption, setSelectedDivOption] = useState(null);
	const [lastName, setLastName] = useState(undefined);



	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	const ClearFilters = () => {
		setSelectedProfOption(null);
		setSelectedDivOption(null);
		setLastName('');
	};

	const getDivisions = async () => {
		try {
			const params = new URLSearchParams();
			const { data } = await axios.get(
				`${PREFIX}/api/v1/divisions`,
				{
					params: params,
					headers: {
						'Authorization': `Bearer ${jwt}`,
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				}
			);
			const sortedOptions = [
				...data.map(item => ({
					value: item.id,
					label: item.title
				}))
			].sort((a, b) => Number(a.value) - Number(b.value));
			console.log( sortedOptions);
			setOptionsDiv( sortedOptions);
		} catch (e) {
			if (e instanceof AxiosError) {
				setError(e.response?.data.detail || e.response?.data.message || 'Неизвестная ошибка логина');
			}
			else {
				setError('Неизвестная ошибка');
			}
		}
	};

	const getProfessions = async () => {
		try {
			const params = new URLSearchParams();
			const { data } = await axios.get(
				`${PREFIX}/api/v1/professions`,
				{
					params: params,
					headers: {
						'Authorization': `Bearer ${jwt}`,
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				}
			);
			const sortedOptions = [
				...data.map(item => ({
					value: item.id,
					label: item.title
				}))
			].sort((a, b) => Number(a.value) - Number(b.value));
			console.log( sortedOptions);
			setOptionsProf(sortedOptions);
		} catch (e) {
			if (e instanceof AxiosError) {
				setError(e.response?.data.detail || e.response?.data.message || 'Неизвестная ошибка логина');
			}
			else {
				setError('Неизвестная ошибка');
			}
		}
	};

	useEffect (() => {
		getProfessions();
		getDivisions();
	}, [jwt]);


	return (
		<div className={styles.users}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
					<Button>
					Добавить сотрудника
					</Button>
					<Button>
					Добавить подразделение
					</Button>
					<Button>
					Удалить подразделение
					</Button>
					<Button>
					Добавить профессию
					</Button>
					<Button>
					Удалить профессию
					</Button>
				</div>
			</div>
			{error && <div className={styles.error}>{error}</div>}
			<div className={styles.outer_table}>
				<div className={styles.filters_table}>
					<Input
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						placeholder="Поиск по ФИО"
					/>
					<CustomSelect
						value={selectedProfOption}
						options={optionsProf}
						placeholder="Фильтр по профессии"
						onChange={setSelectedProfOption}
					>
					</CustomSelect>
					<CustomSelect
						value={selectedDivOption}
						options={optionsDiv}
						placeholder="Фильтр по подразделению"
						onChange={setSelectedDivOption}
					>
					</CustomSelect>
					<buton className={styles.filter_button} onClick={ClearFilters}>
						<img  src="/icons/drop-filters-icon.svg" alt="drop-filters"/>
					</buton>
				</div>
			</div>
		</div>
	);
}