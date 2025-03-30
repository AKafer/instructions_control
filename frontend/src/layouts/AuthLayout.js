import {Link, Outlet} from 'react-router-dom';
import styles from './AuthLayout.module.css';
import React from 'react';
import logo from '../assets/logo.png';

export function AuthLayout() {
	return (
		<div className={styles['layout']}>
			<div className={styles['image-half_screen']}>
				<img src="/worker_image.jpg" alt="Worker with computer"/>
			</div>
			<div className={styles['content']}>
				<div className={styles['firm-logo-container']}>
					<Link to="/">
						<img src={logo} alt="Logo" className={styles['firm-logo']} />
					</Link>
				</div>
				<Outlet/>
			</div>
		</div>
	);
}