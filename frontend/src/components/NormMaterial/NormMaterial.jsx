import React, {useState} from 'react';
import styles from './NormMaterial.module.css';
import Button from '../Button/Button';
import InputForm from '../InputForm/InputForm';

const NormMaterial = ({
	item,
	manageBindNormsApi
}) => {

	const [npaTitle, setNPATitle] = useState(item.npa_link || '');
	const [subModalDelOpen, setSubModalDelOpen] = React.useState(false);
	const [subModalEditOpen, setSubModalEditOpen] = React.useState(false);
	const [period, setPeriod] = useState(item.period || 0);
	const [quantity, setQuantity] = useState(item.quantity || 0);


	const changeNPATitle = (e) => {
		setNPATitle(e.target.value);
	};

	const editModule = async () => {
		await manageBindNormsApi({
			method: 'PATCH',
			payload: {npa_link: npaTitle},
			norm_material_id: item.id,
			trig : true
		});
		setSubModalEditOpen(false);
	};

	const deleteNormMaterial = async () => {
		await manageBindNormsApi({
			method: 'DELETE',
			payload: {'material_type_ids': [item.id]}
		});
		setSubModalDelOpen(false);
	};

	const changePeriod = async(e) => {
		const value = e.target.value;
		if (value === '' || /^\d+$/.test(value)) {
			await manageBindNormsApi({
				method: 'PATCH',
				payload: {period: value},
				norm_material_id: item.id
			});
			setPeriod(value);
		}
	};

	const minusClick = async () => {
		if (quantity > 1) {
			await manageBindNormsApi({
				method: 'PATCH',
				payload: {quantity: quantity - 1},
				norm_material_id: item.id
			});
			setQuantity(quantity - 1);
		}
	};

	const plusClick = () => {
		if (quantity < 100) {
			manageBindNormsApi({
				method: 'PATCH',
				payload: {quantity: quantity + 1},
				norm_material_id: item.id
			});
			setQuantity(quantity + 1);
		}
	};

	return (
		<div className={styles.content}>
			<div className={styles.normTypeMaterial}>
				<div className={styles.ntmContent}>
					<div className={styles.ntmNameTitle}>
						<span className={styles.clampedTextTitle}>
							{item.material_type?.title || 'Не указано'}
						</span>
					</div>
					<div className={styles.ntmNameNPA}>
						<span className={styles.clampedTextNPA}>
							<strong>НПА:</strong> {item.npa_link || 'Не указано'}
						</span>
					</div>
				</div>
				<div className={styles.iconBoxMain}>
					<div className={styles.ntmNameTitle}>
						<span className={styles.clampedTextTitleSub}>
							Период, дней
						</span>
					</div>
					<div className={styles.ntmInputBox}>
						<label className={styles.field}>
							<InputForm
								value={period}
								type="number"
								name="period"
								placeholder="100"
								className={styles.inputNumber}
								onChange={changePeriod}
							/>
						</label>
					</div>

				</div>
				<div className={styles.iconBoxMain}>
					<div className={styles.ntmNameTitle}>
						<span className={styles.clampedTextTitleSub}>
							Кол-во
						</span>
					</div>
					<div className={styles.amountBox}>
						<button className={styles.quantityButton} onClick={minusClick}>
							<img className={styles.iconPlusImage} src="/icons/minus-icon.svg" alt="minus"/>
						</button>
						<span className={styles.quantityText}>{quantity}</span>
						<button className={styles.quantityButton} onClick={plusClick}>
							<img className={styles.iconPlusImage} src="/icons/plus-icon.svg" alt="plus"/>
						</button>
					</div>
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
					НПА:
					<InputForm
						className={styles.input}
						maxLength={320}
						value={npaTitle}
						type="text"
						name="title"
						placeholder="НПА"
						onChange={changeNPATitle}
					/>
				</span>
				<div className={styles.bind_button_box}>
					<Button
						className={styles.bind_button}
						onClick={editModule}>
							Редактировать
					</Button>
				</div>
			</div>}
			{subModalDelOpen && <div className={styles.submodal}>
				<Button className={styles.button_submodal} onClick={deleteNormMaterial}>
										Удалить
				</Button>
				<Button className={styles.button_submodal} onClick={() => setSubModalDelOpen(false)}>
										Отмена
				</Button>
			</div>}
		</div>
	);
};

export default NormMaterial;