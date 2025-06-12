import {Header} from '../../components/Header/Header';
import {Outlet} from 'react-router-dom';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
	return (
		<div className={styles['admin-layout']}>
			<Header start_page="/admin"/>
			<div className={styles['content']}>
				<Outlet/>
			</div>
		</div>
	);
}