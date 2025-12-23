import styles from '../InsGenerator.module.css';
import Input from '../../../../Input/Input';
import {CustomSelect} from '../../../../Select/Select';


export function IntroBriefingInputForm({
	optionsProf,
	selectedProfOption,
	handleProfessionChange,
	managerTitle,
	setManagerTitle,
	equipmentHint,
	setEquipmentHint
}) {
	return (
		<div className={styles.inputs}>
			<CustomSelect
				className={styles.my_wider_select}
				value={selectedProfOption}
				options={optionsProf}
				placeholder="Профессия"
				onChange={handleProfessionChange}
				width="100%"
			/>
			<Input
				placeholder="Должность непосредственного руководителя"
				value={managerTitle}
				onChange={(e) => setManagerTitle(e.target.value)}
			/>
			<Input
				placeholder="Оборудование"
				value={equipmentHint}
				onChange={(e) => setEquipmentHint(e.target.value)}
			/>
		</div>
	);
}
