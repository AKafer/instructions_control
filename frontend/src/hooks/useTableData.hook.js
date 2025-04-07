import { useState, useEffect } from 'react';
import axios from 'axios';

const useTableData = ({
	endpoint,
	initialPage = 1,
	initialPageSize = 10,
	usePagination = true,
	axiosOptions = {},
	filters = {},
	refreshKey = null
}) => {
	const [data, setData] = useState([]);
	const [pagination, setPagination] = useState({
		current: initialPage,
		pageSize: initialPageSize,
		total: 0
	});
	const [loading, setLoading] = useState(false);

	const fetchData = async (page = initialPage, pageSize = initialPageSize, newFilters = filters) => {
		setLoading(true);
		try {
			const params = { ...newFilters };
			if (usePagination) {
				params.page = page;
				params.size = pageSize;
			}
			const response = await axios.get(endpoint, {
				params,
				...axiosOptions
			});
			console.log('response', response);
			setData(response.data.items);
			if (usePagination) {
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize,
					total: response.data.total
				}));
			}
		} catch (error) {
			console.error('Ошибка при загрузке данных:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [endpoint, refreshKey, JSON.stringify(filters)]);

	return { data, pagination, loading, fetchData };
};

export default useTableData;
