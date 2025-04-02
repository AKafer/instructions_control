import styles from './Header.module.css';
import logo from '../../assets/logo-mini.png';
import {Link} from 'react-router-dom';
import {AdminMenu} from '../AdminMenu/AdminMenu';
import {useState} from 'react';
import {Modal} from '../Modals/Modal';
import {Help} from '../Modals/Help/Help';

export function Header({ start_page }) {
	const [isModalHelpOpen, setModalHelpOpen] = useState(false);

	const openModalHelp = () => setModalHelpOpen(true);
	const closeModalHelp = () => setModalHelpOpen(false);

	return (
		<>
			<div className={styles['header']}>
				<div className={styles['logo']}>
					<Link to={start_page}>
						<img src={logo} alt="Логотип" />
					</Link>
				</div>
				<div className={styles['menu']}>
					<AdminMenu />
				</div>
				<div className={styles['icons']}>
					<button onClick={openModalHelp}>
						<img src="/icons/help-icon.svg" alt="Уведомления" />
					</button>
					<Modal isOpen={isModalHelpOpen} onClose={closeModalHelp}>
						<Help />
					</Modal>
					<button>
						<img src="/icons/account-icon.svg" alt="Профиль" />
					</button>
				</div>
			</div>
		</>
	);
}