import axios, { AxiosError } from 'axios';
import { JWT_STORAGE_KEY, PREFIX } from '../helpers/constants';
import { useEffect, useState } from 'react';

const useFillSelect = ({ endpoint, labelField = 'title' }) => {
	const [error, setError] = useState(undefined);
	const [options, setOptions] = useState([]);
	const [itemDict, setItemDict] = useState({});

	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	const getItems = async () => {
		try {
			const params = new URLSearchParams();
			const { data } = await axios.get(`${PREFIX}${endpoint}`, {
				params,
				headers: {
					'Authorization': `Bearer ${jwt}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});

			const sortedOptions = data
				.map(item => ({
					value: item.id,
					label: item[labelField],
					description: item.description
				}))
				.sort((a, b) => a.label.localeCompare(b.label));

			setOptions(sortedOptions);

			const itemDict = data.reduce((acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			}, {});
			setItemDict(itemDict);
		} catch (e) {
			if (e instanceof AxiosError) {
				setError(e.response?.data.detail || e.response?.data.message || 'Неизвестная ошибка логина');
			} else {
				setError('Неизвестная ошибка');
			}
		}
	};

	useEffect(() => {
		getItems();
	}, []);

	return { error, options, itemDict, getItems };
};

export default useFillSelect;
