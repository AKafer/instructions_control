import styles from './AIHelpers.module.css';
import {SimpleListFromDB} from './SimpleListFromDB/SimpleListFromDB';
import {InsGenerator} from './InsGenerator/InsGenerator';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {
	getAllProfessionsUrl,
	TEMPLATES_GROUPED
} from '../../../helpers/constants';


export function AIHelpers() {

	const docsTemplatesUrls = {
		GET_ITEMS: '/documents/get_items',
		DOWNLOAD_ITEMS: '/documents/download_items'
	};

	const getItemsUrl = (itemName, templateName) =>
		`${docsTemplatesUrls.GET_ITEMS}/${itemName}/${templateName}`;

	const downloadItemsUrl = (templateName) =>
		`${docsTemplatesUrls.DOWNLOAD_ITEMS}/${templateName}`;

	const TEMPLATE = Object.freeze(
		Object.fromEntries(
			TEMPLATES_GROUPED
				.flatMap(g => g.templates)
				.filter(t => t.key && t.template)
				.map(t => [t.key, t.template])
		)
	);

	const {
		error: errorProf,
		options: optionsProf,
		itemDict: professionDict,
		getItems: getProfessions
	} = useFillSelect({
		endpoint: getAllProfessionsUrl,
		labelField: 'title'
	});

	const educationWorkerListFormatter = (exempt) =>
		(exempt || [])
			.map(({ profession, programs }) => `${profession}: ${(programs || []).join(', ')}`)
			.join('\n');

	return (
		<div className={styles.helpers_content}>
			<div className={styles.wrapper}>
				<SimpleListFromDB
					Title="Профессии освобождаемые от инструктажа"
					getListUrl={
						getItemsUrl(
							'profession',
							TEMPLATE.NON_QUALIFY_PROF_LIST
						)
					}
					downloadUrl={
						downloadItemsUrl(TEMPLATE.NON_QUALIFY_PROF_LIST)}
				/>
			</div>

			<div className={styles.wrapper}>
				<SimpleListFromDB
					Title="Перечень профессий, требующих обучения по вопросам ОТ"
					getListUrl={
						getItemsUrl(
							'profession',
							TEMPLATE.EDUCATION_WORKERS_LIST
						)
					}
					downloadUrl={
						downloadItemsUrl(TEMPLATE.EDUCATION_WORKERS_LIST)
					}
					formatExempt={educationWorkerListFormatter}
				/>
			</div>

			<div className={styles.wrapper}>
				<SimpleListFromDB
					Title="Перечень профессий, требующих прохождения стажировки"
					getListUrl={
						getItemsUrl(
							'profession',
							TEMPLATE.TRAINEE_WORKERS_LIST
						)
					}
					downloadUrl={
						downloadItemsUrl(TEMPLATE.TRAINEE_WORKERS_LIST)
					}
				/>
			</div>

			<div className={styles.wrapper}>
				<SimpleListFromDB
					Title="Перечень СИЗ требующих обучения"
					getListUrl={
						getItemsUrl(
							'siz',
							TEMPLATE.REQUIRING_TRAINING_SIZ_LIST
						)
					}
					downloadUrl={
						downloadItemsUrl(TEMPLATE.REQUIRING_TRAINING_SIZ_LIST)
					}
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
