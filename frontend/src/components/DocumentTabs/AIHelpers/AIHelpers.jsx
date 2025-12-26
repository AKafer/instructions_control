import styles from './AIHelpers.module.css';
import {SimpleListFromDB} from './SimpleListFromDB/SimpleListFromDB';
import {SectionsGenerator} from './SectionsGenerator/SectionsGenerator';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {
	getAllProfessionsUrl,
	TEMPLATES_GROUPED
} from '../../../helpers/constants';


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
				<SimpleListFromDB />
			</div>

			<div className={styles.wrapper}>
				<SectionsGenerator
					optionsProf={optionsProf}
					professionDict={professionDict}
				/>
			</div>
		</div>
	);
}
