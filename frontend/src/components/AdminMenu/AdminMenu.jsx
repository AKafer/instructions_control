import {Link} from 'react-router-dom';
import styles from '../Header/Header.module.css';


export function AdminMenu() {
	return (
		<>
			<Link to={'/admin/users'} className={styles['menu-item']}>Сотрудники</Link>
			<Link to={'/admin/instructions'} className={styles['menu-item']}>Иструкции</Link>
			<Link to={'/admin/education'} className={styles['menu-item']}>Обучение</Link>
			<Link to={'/admin/SIZ'} className={styles['menu-item']}>СИЗ</Link>
			<Link to={'/admin/medicine'} className={styles['menu-item']}>Медосмотры</Link>
			<Link to={'/admin/terminal'} className={styles['menu-item']}>Терминал</Link>
		</>
	);
}