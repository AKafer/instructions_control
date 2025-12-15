import styles from './AIHelpers.module.css';
import {SimpleListFromDB} from './SimpleListFromDB/SimpleListFromDB';
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
				<SimpleListFromDB
					Title={'Профессии освобождаемые от инструктажа'}
					getListUrl={'/documents/non_qualify_prof_list'}
					downloadUrl={'/documents/non_qualify_prof_list/download'}
				/>
			</div>
			<div className={styles.wrapper}>
				<SimpleListFromDB
					Title={'Перечень СИЗ требующих обучения'}
					getListUrl={'/documents/requiring_training_siz_list'}
					downloadUrl={'/documents/requiring_training_siz_list/download'}
				/>
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
