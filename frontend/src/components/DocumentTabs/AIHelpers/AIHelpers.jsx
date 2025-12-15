import styles from './AIHelpers.module.css';
import {NoInstructionProfs} from './NoInstructionProfs/NoInstructionProfs';
import {InsGenerator} from './InsGenerator/InsGenerator';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {getAllProfessionsUrl} from '../../../helpers/constants';

export function AIHelpers() {

	const {
		error: errorProf,
		options: optionsProf,
		itemDict: professionDict,
		getItems: getProfessions
	} = useFillSelect({
		endpoint: getAllProfessionsUrl,
		labelField: 'title'
	});

	return (
		<div className={styles.helpers_content}>
			<div className={styles.wrapper}>
				<NoInstructionProfs />
			</div>
			<div className={styles.wrapper}>
				<InsGenerator
					optionsProf={optionsProf}
					professionDict={professionDict}
				/>
			</div>
		</div>
	);
}
