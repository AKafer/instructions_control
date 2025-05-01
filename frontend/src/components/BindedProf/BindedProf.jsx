import React from 'react';
import styles from './BindedProf.module.css';
import cn from 'classnames';
import Button from '../Button/Button';

const BindedProf = ({
	rule_id,
	profession_id,
	profDict,
	manageRulesApi
}) => {

	const [subModalOpen, setSubModalOpen] = React.useState(false);

	const deleteBindedProf = () => {
		manageRulesApi('DELETE', {}, rule_id);
	};

	return (
		<div className={styles.content}>
			<div className={styles.bindedProf}>
				<div className={styles.professionName}>
					<span className={styles.clampedText}>
						{profDict[profession_id] ?? `id ${profession_id}`}
					</span>
				</div>
				<div className={styles.iconBox}>
					<button className={styles.iconButton} onClick={() => setSubModalOpen(!subModalOpen)}>
						<img className={styles.iconImage} src="/icons/delete-icon.svg" alt="delete"/>
					</button>

				</div>
			</div>
			{subModalOpen && <div className={styles.submodal}>
				<Button className={styles.button_submodal} onClick={deleteBindedProf}>
										Удалить
				</Button>
				<Button className={styles.button_submodal} onClick={() => setSubModalOpen(false)}>
										Отмена
				</Button>
			</div>}
		</div>
	);
};

export default BindedProf;