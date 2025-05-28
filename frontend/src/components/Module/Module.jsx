import React, {useState} from 'react';
import styles from './Module.module.css';
import Button from '../Button/Button';
import cn from 'classnames';
import InputForm from '../InputForm/InputForm';

const Module = ({
	displayIndex,
	module,
	manageModulesApi
}) => {

	const [moduleTitle, setModuleTitle] = useState(module.title);
	const [moduleFile, setModuleFile] = useState(null);
	const inputModuleRef = React.useRef(null);
	const [subModalDelOpen, setSubModalDelOpen] = React.useState(false);
	const [subModalEditOpen, setSubModalEditOpen] = React.useState(false);


	const changeModuleTitle = (e) => {
		setModuleTitle(e.target.value);
	};

	const editModule = async () => {
		const data = new FormData();
		data.append('file', moduleFile ?? '');
		data.append('title', moduleTitle ?? '');
		manageModulesApi('PATCH', data, module.id);
		setSubModalEditOpen(false);
	};

	const deleteModule = async () => {
		manageModulesApi('DELETE', {}, module.id);
		setSubModalDelOpen(false);
	};

	const moveModuleUp = async () => {
		const data = {'move': 'up'};
		manageModulesApi('MOVE', data, module.id);
	};

	const moveModuleDown = async () => {
		const data = {'move': 'down'};
		manageModulesApi('MOVE', data, module.id);
	};

	return (
		<div className={styles.content}>
			<div className={styles.module}>
				<div className={styles.displayIndex}>
					<span className={styles.clampedText}>
						{displayIndex}
					</span>
				</div>
				<div className={styles.moduleContent}>
					<div className={styles.fileLinkBox}>
						<a
							href={module.link || undefined}
							target="_blank"
					    	rel="noreferrer"
							className={cn(styles.fileLink, {
								[styles.disabled]: !module.link
							})}
						>
							<img
								className={styles.iconImageFile}
								src="/icons/doc-icon.svg"
								alt="NormMaterial file"/>
						</a>
					</div>
					<div className={styles.professionName}>
						<span className={styles.clampedText}>
							{module.title}
						</span>
					</div>
				</div>
				<div className={styles.iconBox}>
					<div className={styles.editIconBox}>
						<button className={styles.iconButton} onClick={moveModuleUp}>
							<img className={styles.iconSparrow} src="/icons/up-icon.svg" alt="up"/>
						</button>
					</div>
					<button className={styles.iconButton} onClick={moveModuleDown}>
						<img className={cn(styles.iconSparrow, styles.downSparrow)} src="/icons/up-icon.svg" alt="down"/>
					</button>
				</div>
				<div className={styles.iconBox}>
					<div className={styles.editIconBox}>
						<button className={styles.iconButton} onClick={() => {
							setSubModalEditOpen(!subModalEditOpen);
							setSubModalDelOpen(false);
						}}>
							<img className={styles.iconEditImage} src="/icons/edit-icon.svg" alt="edit"/>
						</button>
					</div>
					<button className={styles.iconButton} onClick={() => {
						setSubModalDelOpen(!subModalDelOpen);
						setSubModalEditOpen(false);
					}}>
						<img className={styles.iconImage} src="/icons/delete-icon.svg" alt="delete"/>
					</button>
				</div>
			</div>
			{subModalEditOpen && <div className={styles.submodalEdit}>
				<span
					className={styles['span']}
				>
					Наименование:
					<InputForm
						className={styles.input}
						maxLength={64}
						value={moduleTitle}
						type="text"
						name="title"
						placeholder="Наименование"
						onChange={changeModuleTitle}
					/>
				</span>
				<div className={styles.fileButtonBox}>
					<input
						ref={inputModuleRef}
						type="file"
						onChange={(e) => {
							setModuleFile(e.target.files[0]);
							e.target.value = '';
						}}
						className={styles.hiddenInput}
					/>
					<Button
						className={styles.fileButton}
						onClick={() => {
							inputModuleRef.current?.click();
						}}
					>
							Изменить файл
					</Button>
					<div className={styles.fileName}>
						{moduleFile?.name || 'файл не выбран'}
					</div>
				</div>
				<div className={styles.bind_button_box}>
					<Button
						className={styles.bind_button}
						onClick={editModule}>
							Редактировать
					</Button>
				</div>
			</div>}
			{subModalDelOpen && <div className={styles.submodal}>
				<Button className={styles.button_submodal} onClick={deleteModule}>
										Удалить
				</Button>
				<Button className={styles.button_submodal} onClick={() => setSubModalDelOpen(false)}>
										Отмена
				</Button>
			</div>}
		</div>
	);
};

export default Module;