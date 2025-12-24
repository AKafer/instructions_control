import styles from './InsInputForm.module.css';
import {CustomSelect} from '../../../../Select/Select';
import Input from '../../../../Input/Input';
import {Textarea} from '../../../../textarea/Textarea';
import Spinner from '../../../../Spinner/Spinner';


export function InsInputForm({
	optionsProf,
	selectedProfOption,
	handleProfessionChange,
	description,
	setDescription,
	materials,
	smallLoading
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
				placeholder="Описание"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
			/>
			<div className={styles.textareaContainer}>
				<Textarea
					placeholder="Материалы (через запятую)"
					value={materials}
					disabled={true}
					className={styles.textarea_siz}
				/>
				{smallLoading && (
					<div className={styles.spinnerOverlay}>
						<Spinner showSeconds={true} />
					</div>
				)}
			</div>
		</div>
	);
}