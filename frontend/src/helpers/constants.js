export const PREFIX = process.env.REACT_APP_API_URL || '';
export const JWT_STORAGE_KEY = 'jwt';
export const EMAIL_STORAGE_KEY = 'email';

export const getAllProfessionsUrl = '/professions/';
export const getAllActivitiesUrl = '/activities/';
export const getAllBindActivitiesUrl = '/activities/relations/';
export const getAllDivisionsUrl = '/divisions/';
export const getAllRulesUrl = '/rules/';
export const getAllModulesUrl = '/training_modules/';
export const getAllInstructionsUrl = '/instructions/';
export const getAllUsersUrl = '/users';
export const registerUrl = '/auth/register';
export const loginUrl = '/auth/jwt/login';
export const getAllUsersPaginatedUrl = '/users/paginated';
export const getAllUsersPaginatedLightUrl = '/users/paginated_light';
export const getAllMaterialTypesUrl = '/material_types/';
export const getCalculateNeedUrl = '/material_types/calculate_need_all';
export const getAllNormsUrl = '/norms/';
export const getAllMaterialsUrl = '/materials/';
export const getAllMaterialsPaginatedUrl = '/materials/paginated';
export const getAllTestsUrl = '/tests/tests';
export const getAllHistoriesPaginatedUrl = '/histories/paginated?type__in=TEST_EXECUTION';

export const unitsOfMeasurements = [
	{ value: 'шт', label: 'шт' },
	{ value: 'пар', label: 'пар' },
	{ value: 'мл', label: 'мл' },
	{ value: 'гр', label: 'гр' },
	{ value: 'компл', label: 'компл' }
];

export const typeSizes = [
	{ value: 'clothing_size', label: 'Одежда' },
	{ value: 'shoe_size', label: 'Обувь' },
	{ value: 'head_size', label: 'Для головы' },
	{ value: 'mask_size', label: 'Для лица' },
	{ value: 'gloves_size', label: 'Перчатки' },
	{ value: 'mitten_size', label: 'Варежки' }
];

export const TEMPLATES_GROUPED = [
	{
		group: 'АИ Помощник',
		templates: [
			{ name: 'Перечень профессий освобожденных от первичного инструктажа', template: 'non_qualify_prof_list' },
			{ name: 'ИОТ Бланк', template: 'iot_blank' },
			{ name: 'Перечень СИЗ требующих обучения', template: 'requiring_training_siz_list' },
			{ name: 'Перечень стажирующихся работников', template: 'trainee_workers_list' },
			{ name: 'Программа вводного инструктажа', template: 'introductory_briefing_program' }
		]
	},
	{
		group: 'Персональные',
		templates: [
			{
				name: 'Акт регистрации вводного инструктажа',
				template: 'act_reg_intro',
				placeholders: [ '{{дата документа}}']
			},
			{
				name: 'Акт регистрации вводного по ГО',
				template: 'act_reg_civil_def',
				placeholders: [ '{{дата документа}}']
			},
			{
				name: 'Акт регистрации первичного инструктажа',
				template: 'act_reg_primary',
				placeholders: [ '{{дата документа}}']
			},
			{
				name: 'Журнал вводного и первичного по ПБ',
				template: 'journal_intro_primary',
				placeholders: ['{{дата документа}}']
			},
			{
				name: 'Лист ознакомления с ЛНА работником',
				template: 'lnna_ack',
				placeholders: [ '{{дата ознакомления с лна}}' ]
			},
			{
				name: 'ЛК СИЗ',
				template: 'lk_siz',
				placeholders: ['{{дата выдачи СИЗ}}']
			},
			{
				name: 'Приказ о стажировке',
				template: 'order_internship',
				placeholders: [
					'{{дата документа}}',
					'{{дата начала стажировки}}',
					'{{дата окончания стажировки}}'
				]
			},
			{
				name: 'Стажировочный лист',
				template: 'internship_sheet',
				placeholders: [
					'{{дата начала стажировки}}',
					'{{дата окончания стажировки}}'
				]
			},
			{
				name: 'Направление на МО',
				template: 'ref_medical_exam',
				placeholders: [
					'{{дата документа}}',
					'{{наименование мед организации}}'
				]
			},
			{
				name: 'Протокол проверки знаний',
				template: 'knowledge_testing_protocol',
				placeholders: [
					'{{дата документа}}'
				]
			}
		]
	},
	{
		group: 'Для организации',
		templates: [
			{ name: 'Журнал вводного и первичного по ПБ', template: 'journal_intro_primary' },
			{ name: 'Журнал Реестр учета микроповреждений', template: 'journal_microdamage' },
			{ name: 'Журнал учета несчастных случаев', template: 'journal_accidents' },
			{ name: 'ИОТ-ОППП-01 Первая помощь', template: 'iot_first_aid' },
			{ name: 'ИОТ-СИЗ-04 СИЗ', template: 'iot_siz' },
			{ name: 'Перечень инструкций', template: 'list_instructions' },
			{ name: 'Положение об обеспечении СИЗ', template: 'policy_siz' },
			{ name: 'Положение о несчастных случаях', template: 'policy_accidents' },
			{ name: 'Положение о порядке обучения ОТ', template: 'policy_training' },
			{ name: 'Положение о СУОТ', template: 'policy_suot' },
			{ name: 'Приказ об утверждении ЛНА по ОТ', template: 'order_approve_lna' },
			{ name: 'Приказ о сан постах', template: 'order_san_posts' },
			{ name: 'Приказ о старте новой СУОТ', template: 'order_start_suot' },
			{ name: 'Приказ ответственный за ОТ', template: 'order_responsible_ot' },
			{ name: 'Программа обучения по использованию СИЗ', template: 'program_siz_usage' },
			{ name: 'Программа обучения по общим вопросам СУОТ', template: 'program_general_suot' },
			{ name: 'Программа обучения по оказанию первой помощи', template: 'program_first_aid' },
			{ name: 'Программа обучения при воздействии вредных и опасных факторов', template: 'program_hazard_factors' },
			{ name: 'Программа стажировки на рабочем месте', template: 'program_workplace_internship' }
		]
	}
];
