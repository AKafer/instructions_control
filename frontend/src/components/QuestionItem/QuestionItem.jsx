import React, { useState } from 'react';
import cn from 'classnames';
import styles from './QuestionItem.module.css';
import Button from '../Button/Button';

export default function QuestionItem({
	question,
	checked,
	onToggle,
	className,
	showCheckbox = true,
	deletable = false,
	onDelete
}) {
	const { id, question: text, answers = [], correct_answer_id } = question || {};
	const [confirmOpen, setConfirmOpen] = useState(false);

	const handleDeleteClick = (e) => {
		e.stopPropagation();
		setConfirmOpen(!confirmOpen);
	};

	const confirmDelete = () => {
		setConfirmOpen(false);
		if (typeof onDelete === 'function') onDelete(question);
	};

	const cancelDelete = () => setConfirmOpen(false);

	return (
		<div className={styles.content}>
			<div className={cn(styles.item, className)}>
				<div className={styles.left_box}>
					<div className={styles.header}>
						{showCheckbox && (
							<input
								className={styles.checkbox}
								type="checkbox"
								checked={!!checked}
								onChange={onToggle}
							/>
						)}
						<div className={styles.questionText}>
							<strong>#{id}</strong> {text}
						</div>
					</div>

					<ul className={styles.answers}>
						{answers.map((a) => (
							<li key={a.id} className={styles.answerItem}>
								{a.id}. {a.text}
								{correct_answer_id === a.id && (
									<span className={styles.correctMark}>(верный)</span>
								)}
							</li>
						))}
					</ul>
				</div>


				<div className={styles.right_box}>
					{deletable && (
						<button
							type="button"
							className={styles.iconButton}
							onClick={handleDeleteClick}
							aria-label="Удалить вопрос"
							title="Удалить вопрос"
						>
							<img className={styles.iconImage} src="/icons/delete-icon.svg" alt="" />
						</button>
					)}
				
				</div>


			</div>
			{deletable && confirmOpen && (
				<div className={styles.submodal}>
					<Button className={styles.button_submodal} onClick={confirmDelete}>
                                            Удалить
					</Button>
					<Button className={styles.button_submodal} onClick={cancelDelete}>
                                            Отмена
					</Button>
				</div>
			)}
		</div>
	);
}
