import styles from './OrganizationManage.module.css';

import Button from '../../../Button/Button';
import cn from 'classnames';


export default function OrganizationManage({
	onGenerate, loading, selectedTemplate
}) {

	return (
		<div className={styles.usersBox}>
			<div className={styles.managePanel}>
				<div className={cn(
					styles.bottomRow,
					{ [styles.disabled]: !selectedTemplate }
				)}>
					<Button onClick={onGenerate}>Сформировать</Button>
				</div>
			</div>
		</div>
	);
}
