import React, { useEffect, useState } from 'react';
import { Table } from 'antd';

/**
 * Кастомный хук для загрузки данных таблицы.
 * @param {string} endpoint - URL для запроса данных.
 * @param {number} initialPage - начальный номер страницы.
 * @param {number} initialPageSize - начальный размер страницы.
 * @param {boolean} usePagination - флаг, использовать ли пагинацию.
 * @param {object} fetchOptions - дополнительные опции для fetch.
 */
const useTableData = ({ endpoint, initialPage = 1, initialPageSize = 10, usePagination = true, fetchOptions = {} }) => {
	const [data, setData] = useState([]);
	const [pagination, setPagination] = useState({
		current: initialPage,
		pageSize: initialPageSize,
		total: 0
	});
	const [loading, setLoading] = useState(false);

	const fetchData = async (page = initialPage, pageSize = initialPageSize) => {
		setLoading(true);
		try {
			// Формируем URL с параметрами, если используется пагинация
			const url = new URL(endpoint);
			if (usePagination) {
				url.searchParams.append('page', page);
				url.searchParams.append('pageSize', pageSize);
			}
			const response = await fetch(url.toString(), fetchOptions);
			const json = await response.json();
			// Ожидается, что API вернёт объект вида: { data: [...], total: <число> }
			setData(json.data);
			if (usePagination) {
				setPagination(prev => ({
					...prev,
					current: page,
					pageSize,
					total: json.total
				}));
			}
		} catch (error) {
			console.error('Ошибка при загрузке данных:', error);
		} finally {
			setLoading(false);
		}
	};

	// Загружаем данные при изменении эндпойнта
	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [endpoint]);

	return { data, pagination, loading, fetchData };
};

/**
 * Универсальный компонент таблицы.
 *
 * @param {object} props
 * @param {string} props.endpoint - URL эндпойнта для загрузки данных.
 * @param {Array} props.columns - Определение столбцов для таблицы.
 * @param {boolean} [props.usePagination=true] - Использовать ли пагинацию.
 * @param {number} [props.initialPage=1] - Начальный номер страницы.
 * @param {number} [props.initialPageSize=10] - Начальный размер страницы.
 * @param {object} [props.fetchOptions={}] - Дополнительные опции для запроса fetch.
 * @param {object} [props.tableProps={}] - Дополнительные пропсы для компонента Table.
 */
const UniversalTable = ({
	endpoint,
	columns,
	usePagination = true,
	initialPage = 1,
	initialPageSize = 10,
	fetchOptions = {},
	tableProps = {}
}) => {
	const { data, pagination, loading, fetchData } = useTableData({
		endpoint,
		initialPage,
		initialPageSize,
		usePagination,
		fetchOptions
	});

	// Обработчик смены страницы или изменения размера страницы
	const handleTableChange = (paginationConfig) => {
		if (usePagination) {
			fetchData(paginationConfig.current, paginationConfig.pageSize);
		}
	};

	return (
		<Table
			columns={columns}
			dataSource={data}
			loading={loading}
			rowKey="id" // предполагается, что каждая запись имеет уникальное поле id; при необходимости можно параметризировать
			onChange={handleTableChange}
			pagination={usePagination ? pagination : false}
			{...tableProps}
		/>
	);
};


export default UniversalTable;
