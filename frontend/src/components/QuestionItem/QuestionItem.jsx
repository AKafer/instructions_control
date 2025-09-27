import React from 'react';
import cn from 'classnames';
import styles from './QuestionItem.module.css';

export default function QuestionItem({ question, checked, onToggle, className }) {
	const { id, question: text, answers = [], correct_answer_id } = question || {};

	return (
		<div className={cn(styles.item, className)}>
			<div className={styles.header}>
				<input
					className={styles.checkbox}
					type="checkbox"
					checked={!!checked}
					onChange={onToggle}
				/>
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
	);
}
