import styles from './EditUser.module.css';
import Button from '../../Button/Button';


export function EditUser({user}) {

	return (
		<div className={styles['help']}>
			<div className={styles['content']}>
				<div className={styles['title']}>
					Профиль: {user.name}
				</div>
			</div>
			<div className={styles['button']}>
				<Button onClick={() => console.log(`Edit${user.id}`)}>
					Выход
				</Button>
			</div>
		</div>
	);
}