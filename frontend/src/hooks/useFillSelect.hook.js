import axios, { AxiosError } from 'axios';
import { JWT_STORAGE_KEY } from '../helpers/constants';
import { useEffect, useState } from 'react';
import useApi from './useApi.hook';

const useFillSelect = ({ endpoint, labelField = 'title' }) => {
	const [error, setError] = useState(undefined);
	const [options, setOptions] = useState([]);
	const [itemDict, setItemDict] = useState({});
	const api = useApi();

	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	const getItems = async () => {
		try {
			const params = new URLSearchParams();
			const { data } = await api.get(`${endpoint}`, {
				params,
				headers: {
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
			setError(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	useEffect(() => {
		getItems();
	}, []);

	return { error, options, itemDict, getItems };
};

export default useFillSelect;
