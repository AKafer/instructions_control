import React, { useEffect, useMemo } from 'react';
import { Table } from 'antd';
import useTableData from '../../hooks/useTableData.hook';
import styles from './UTable.module.css';

const UniversalTable = ({
	endpoint,
	columns,
	usePagination = true,
	initialPage = 1,
	initialPageSize = 10,
	filters = {},
	tableProps = {},
	onTotalRecordsChange = () => {},
	formatData = item => item,
	refreshKey = null,
	height = 500
}) => {
	const { data, pagination, loading, fetchData } = useTableData({
		endpoint,
		initialPage,
		initialPageSize,
		usePagination,
		filters,
		refreshKey
	});

	const formattedData = useMemo(() => {
		if (Array.isArray(data)) {
			return data.map(item => formatData(item));
		} else {
			return formatData(data);
		}
	}, [data, formatData]);

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
			<div
				className={styles.tableContainer}
				style={!usePagination ? { height: `${height}px`, overflowY: 'auto' } : {}}
			>
				<Table
					size="small"
					className={styles.customTable}
					columns={columns}
					dataSource={formattedData}
					loading={loading}
					rowKey="id"
					onChange={handleTableChange}
					pagination={
						usePagination
							? {
								...pagination,
								showSizeChanger: true,
								pageSizeOptions: ['10', '20', '50', '100']
							}
							: false
					}
					{...tableProps}
				/>
			</div>
		</div>
	);
};

export default UniversalTable;
