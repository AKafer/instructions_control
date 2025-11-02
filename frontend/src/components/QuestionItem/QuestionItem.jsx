import React, {useEffect, useState} from 'react';
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
	onDelete,
	editable = false,
	onChange = undefined,
	showSave = false,
	onSave = undefined,
	saving = false    
}) {
	const { id, question: text, answers = [], correct_answer_id } = question || {};
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [local, setLocal] = useState({
		id: question?.id,
		question: question?.question ?? '',
		answers: Array.isArray(question?.answers) ? question.answers.map(a => ({ ...a })) : [],
		correct_answer_id: question?.correct_answer_id ?? question?.correct_answer ?? null
	});
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		setLocal({
			id: question?.id,
			question: question?.question ?? '',
			answers: Array.isArray(question?.answers) ? question.answers.map(a => ({...a})) : [],
			correct_answer_id: question?.correct_answer_id ?? question?.correct_answer ?? null
		});
	}, [question]);

	const handleFieldChange = (field, value) => {
		const next = { ...local, [field]: value };
		setLocal(next);
		if (typeof onChange === 'function') onChange(next);
	};

	const handleAnswerChange = (idx, value) => {
		const answers = local.answers.map((a, i) => i === idx ? { ...a, text: value } : a);
		const next = { ...local, answers };
		setLocal(next);
		if (typeof onChange === 'function') onChange(next);
	};

	const handleCorrectChange = (answerId) => {
		const next = { ...local, correct_answer_id: answerId };
		setLocal(next);
		if (typeof onChange === 'function') onChange(next);
	};

	const handleSaveClick = async () => {
		if (typeof onSave === 'function') {
			try {
				await onSave(local);
				setSaved(true);
				setTimeout(() => setSaved(false), 1000);
			} catch (err) {
				console.error(err);
			}
		} else if (typeof onChange === 'function') {
			onChange(local);
			setSaved(true);
			setTimeout(() => setSaved(false), 1000);
		}
	};


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




					{editable ? (
						<div className={styles.editableBlock}>
							<div className={styles.header}>
								{showCheckbox && (
									<input
										className={styles.checkbox}
										type="checkbox"
										checked={!!checked}
										onChange={onToggle}
									/>
								)}
								<div className={styles.questionTextEditable}>
									<strong>#{local.id}</strong>
									<textarea
										value={local.question}
										onChange={(e) => handleFieldChange('question', e.target.value)}
										className={styles.questionTextarea}
										rows={2}
									/>
								</div>
							</div>

							<ul className={styles.answers}>
								{local.answers.map((a, idx) => (
									<li key={a.id ?? idx} className={styles.answerItemEditable}>
										<label className={styles.answerRow}>
											<input
												type="radio"
												name={`correct-${local.id}`}
												checked={local.correct_answer_id === a.id}
												onChange={() => handleCorrectChange(a.id)}
											/>
											<input
												type="text"
												value={a.text ?? ''}
												onChange={(e) => handleAnswerChange(idx, e.target.value)}
												className={styles.answerInput}
											/>
										</label>
									</li>
								))}
							</ul>
						</div>
					) : (
						<>
							<div className={styles.questionText}>
								<strong>#{id}</strong> {text}
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
						</>
					)}
				</div>


				<div className={styles.right_box}>
					{showSave && editable && (
						<button
							type="button"
							className={styles.iconButton}
							onClick={handleSaveClick}
							aria-label="Сохранить вопрос"
							title="Сохранить вопрос"
						>
							{saved ? (
								<img className={styles.iconImage} src="/icons/check-icon.svg" alt="Сохранено" />
							) : (
								<img className={styles.iconImage} src="/icons/save-icon.svg" alt="Сохранить" />
							)}
						</button>
					)}
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
