import styles from './SectionsGenerator.module.css';
import React, {useState} from 'react';
import cn from 'classnames';
import useApi from '../../../../hooks/useApi.hook';
import {Textarea} from '../../../textarea/Textarea';
import Spinner from '../../../Spinner/Spinner';
import Button from '../../../Button/Button';
import {CustomSelect} from '../../../Select/Select';
import {InsInputForm} from './InsInputForm/InsInputForm';
import {PrimaryBriefingInputForm} from './PrimaryBriefingInputForm/PrimaryBriefingInputForm';
import Input from '../../../Input/Input';


export function SectionsGenerator({optionsProf, professionDict}) {
	const api = useApi();
	const baseGenerateUrl = '/documents/sections_generate/';
	const baseDownloadUrl = '/documents/download_sections_document/';
	const TEMPLATES = {
		iot_blank: {
			label: 'Инструкция по охране труда'
		},
		primary_briefing_program: {
			label: 'Программа первичного инструктажа'
		}
	};

	const [loading, setLoading] = useState(false);
	const [smallLoading, setSmallLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const [selectedProfOption, setSelectedProfOption] = useState(null);
	const [profession, setProfession] = useState('');
	const [description, setDescription] = useState('');
	const [materials, setMaterials] = useState('');
	const [sections, setSections] = useState({});
	const [selectedSection, setSelectedSection] = useState(null);
	const [textareaValue, setTextareaValue] = useState('');
	const [managerTitle, setManagerTitle] = useState('');
	const [equipmentHint, setEquipmentHint] = useState('');
	const [searchIndex, setSearchIndex] = useState(null);

	const templateOptions = Object.entries(TEMPLATES).map(([value, t]) => ({
		value,
		label: t.label
	}));

	const handleTemplateChange = (option) => {
		setSelectedTemplate(option);
		setSections({});
		setSelectedSection(null);
		setTextareaValue('');
		setError(undefined);
	};

	const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0]);


	const handleGenerate = async () => {
		setError(undefined);
		setLoading(true);

		let payload;
		if (selectedTemplate.value === 'iot_blank') {
			payload = {
				search_index: searchIndex,
				profession: profession,
				description: description,
				sizo: materials.split(',').map(s => s.trim()).filter(Boolean)
			};
		}

		if (selectedTemplate.value === 'primary_briefing_program') {
			payload = {
				search_index: searchIndex,
				profession: profession,
				manager_title: managerTitle,
				equipment_hint: equipmentHint
			};
		}

		try {
			const { data } = await api.post(`${baseGenerateUrl}${selectedTemplate.value}`, payload);
			setSections(data);

			const firstKey = Object.keys(data)[0];
			if (firstKey) {
				setSelectedSection({value: firstKey, label: data[firstKey].title});
				setTextareaValue(data[firstKey].text);
			}
		} catch (e) {
			const msg = e?.response?.data?.detail || e?.message || 'Ошибка при запросе к серверу';
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	const handleSectionChange = (newSection) => {
		if (selectedSection) {
			setSections(prev => ({
				...prev,
				[selectedSection.value]: {
					...prev[selectedSection.value],
					text: textareaValue
				}
			}));
		}

		setSelectedSection(newSection);
		setTextareaValue(sections[newSection.value]?.text || '');
	};

	const handleTextareaChange = (value) => {
		setTextareaValue(value);
		if (selectedSection?.value) {
			setSections(prev => ({
				...prev,
				[selectedSection.value]: {
					...prev[selectedSection.value],
					text: value
				}
			}));
		}
	};

	const handleDownload = async () => {
		setError(undefined);
		setLoading(true);

		try {
			const payloadSections = {};
			for (const key in sections) {
				payloadSections[key] = {
					title: sections[key].title,
					text: sections[key].text
				};
			}

			const response = await api.post(
				`${baseDownloadUrl}${selectedTemplate.value}`,
				{
					profession,
					sections: payloadSections
				},
				{responseType: 'blob'}
			);

			const blob = new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'Document.docx';
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			const msg = e?.response?.data?.detail || e?.message || 'Ошибка при запросе к серверу';
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	const sectionOptions = Object.keys(sections).map(key => ({
		value: key,
		label: sections[key].title
	}));

	const handleProfessionChange = async (option) => {
		setSelectedProfOption(option);
		setMaterials('');
		setSmallLoading(true);

		if (!option) {
			setProfession('');
			return;
		}

		const prof = professionDict[option.value];
		setProfession(prof?.title || '');
		console.log(professionDict);


		try {
			const { data } = await api.get(`/professions/${option.value}`);

			const materialTitles =
			data?.norm?.material_norm_types
				?.map(item => item.material_type?.title)
				.filter(Boolean) || [];

			setMaterials(materialTitles.join(', '));
		} catch (e) {
			console.error(e);
			setMaterials('');
		} finally {
			setSmallLoading(false);
		}
	};

	return (
		<>
			{error && (
				<div className={styles.error} onClick={() => setError(undefined)}>
					{error} <span className={styles.errorClose}>✖</span>
				</div>
			)}
			<h1 className={styles.title}>Генератор секционных документов</h1>
			<div className={styles.formWrapper}>
				<div className={styles.inputs}>
					<CustomSelect
						className={styles.my_wider_select}
						value={selectedTemplate}
						options={templateOptions}
						placeholder="Тип документа"
						onChange={handleTemplateChange}
						width="100%"
					/>
					<Input
						placeholder="Поисковый индекс"
						value={searchIndex}
						onChange={(e) => setSearchIndex(e.target.value)}
					/>

					{selectedTemplate?.value === 'iot_blank' && (
						<InsInputForm
							optionsProf={optionsProf}
							selectedProfOption={selectedProfOption}
							handleProfessionChange={handleProfessionChange}
							description={description}
							setDescription={setDescription}
							materials={materials}
							smallLoading={smallLoading}
						/>
					)}

					{selectedTemplate?.value === 'primary_briefing_program' && (
						<PrimaryBriefingInputForm
							optionsProf={optionsProf}
							selectedProfOption={selectedProfOption}
							handleProfessionChange={handleProfessionChange}
							managerTitle={managerTitle}
							setManagerTitle={setManagerTitle}
							equipmentHint={equipmentHint}
							setEquipmentHint={setEquipmentHint}
						/>
					)}

				</div>

				<div className={styles.output}>
					<CustomSelect
						className={styles.my_wider_select}
						options={sectionOptions}
						value={selectedSection}
						placeholder="Выберите секцию"
						onChange={handleSectionChange}
						width="100%"
					/>
					<div className={styles.textareaContainer}>
						<Textarea
							text={textareaValue}
							setText={handleTextareaChange}
							placeholder="Текст инструкции будет здесь"
							disabled={false}
							className={styles.textarea_output}
						/>
						{loading && (
							<div className={styles.spinnerOverlay}>
								<Spinner showSeconds={true} />
							</div>
						)}
					</div>
				</div>
			</div>

			<div className={styles.buttonsContainer}>
				<div className={styles.button}>
					<Button onClick={handleGenerate} disabled={loading}>
						{loading ? 'Запрос в обработке...' : 'Сформировать'}
					</Button>
				</div>
				<div className={styles.button}>
					<Button
						onClick={handleDownload}
						disabled={!profession || !Object.keys(sections).length}
						className={cn({ [styles.disabled]: !profession || !Object.keys(sections).length })}
					>
						Выгрузить в файл
					</Button>
				</div>
			</div>
		</>
	);
}
