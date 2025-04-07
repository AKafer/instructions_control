import React, {useEffect} from 'react';
import { Table } from 'antd';
import useTableData from '../../hooks/useTableData.hook';
import styles from './UTable.module.css';
;

/**
 * Универсальный компонент таблицы.
 *
 * @param {object} props
 * @param {string} props.endpoint - URL эндпойнта для загрузки данных.
 * @param {Array} props.columns - Определение столбцов для таблицы.
 * @param {boolean} [props.usePagination=true] - Использовать ли пагинацию.
 * @param {number} [props.initialPage=1] - Начальный номер страницы.
 * @param {number} [props.initialPageSize=10] - Начальный размер страницы.
 * @param {object} [props.axiosOptions={}] - Дополнительные опции для запроса axios.
 * @param {object} [props.filters={}] - Дополнительные фильтры в виде query-параметров.
 * @param {object} [props.tableProps={}] - Дополнительные пропсы для компонента Table.
 */
const UniversalTable = ({
	endpoint,
	columns,
	usePagination = true,
	initialPage = 1,
	initialPageSize = 10,
	axiosOptions = {},
	filters = {},
	tableProps = {},
	onTotalRecordsChange = () => {},
	refreshKey = null
}) => {
	const { data, pagination, loading, fetchData } = useTableData({
		endpoint,
		initialPage,
		initialPageSize,
		usePagination,
		axiosOptions,
		filters,
		refreshKey
	});


	useEffect(() => {
		if (pagination?.total !== undefined) {
			onTotalRecordsChange(pagination.total);
		}
	}, [pagination?.total]);

	const handleTableChange = (paginationConfig) => {
		if (usePagination) {
			fetchData(paginationConfig.current, paginationConfig.pageSize);
		}
	};

	return (
		<div className={styles.tableWrapper}>
			<div className={styles.customTable}>
				<Table
					className={`${styles.customTable}`}
					columns={columns}
					dataSource={data}
					loading={loading}
					rowKey="id"
					onChange={handleTableChange}
					pagination={{
						...pagination,
						showSizeChanger: true,
						pageSizeOptions: ['10', '20', '50', '100']
					}}
					{...tableProps}
				/>
			</div>
		</div>
	);
};

export default UniversalTable;
