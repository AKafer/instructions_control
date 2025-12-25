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
		group: 'aiHelper',
		templates: [
			{
				key: 'NON_QUALIFY_PROF_LIST',
				name: 'Перечень профессий освобожденных от первичного инструктажа',
				template: 'non_qualify_prof_list',
				itemName: 'profession'
			},
			{
				key: 'IOT_BLANK',
				name: 'Инструкция по охране труда',
				template: 'iot_blank'
			},
			{
				key: 'REQUIRING_TRAINING_SIZ_LIST',
				name: 'Перечень СИЗ требующих обучения',
				template: 'requiring_training_siz_list',
				itemName: 'siz'
			},
			{
				key: 'TRAINEE_WORKERS_LIST',
				name: 'Перечень стажирующихся работников',
				template: 'trainee_workers_list',
				itemName: 'profession'
			},
			{
				key: 'INTRODUCTORY_BRIEFING_PROGRAM',
				name: 'Программа вводного инструктажа',
				template: 'introductory_briefing_program',
				itemName: 'skip'
			},
			{
				key: 'PRIMARY_BRIEFING_PROGRAM',
				name: 'Программа первичного инструктажа',
				template: 'primary_briefing_program'
			},
			{
				key: 'EDUCATION_WORKERS_LIST',
				name: 'Перечень профессий, требующих обучения по вопросам ОТ',
				template: 'education_workers_list',
				itemName: 'profession'
			},
			{
				key: 'NORMS_DSIZ_ISSUANCE',
				name: 'Нормы выдачи ДСИЗ',
				template: 'norms_dsiz_issuance',
				itemName: 'profession'
			}
		]
	},
	{
		group: 'personals',
		templates: [
			{
				key: 'ACT_REG_INTRO',
				name: 'Акт регистрации вводного инструктажа',
				template: 'act_reg_intro',
				placeholders: [ '{{дата документа}}']
			},
			{
				key: 'ACT_REG_CIVIL_DEF',
				name: 'Акт регистрации вводного по ГО',
				template: 'act_reg_civil_def',
				placeholders: [ '{{дата документа}}']
			},
			{
				key: 'ACT_REG_PRIMARY',
				name: 'Акт регистрации первичного инструктажа',
				template: 'act_reg_primary',
				placeholders: [ '{{дата документа}}']
			},
			{
				key: 'JOURNAL_INTRO_PRIMARY',
				name: 'Журнал вводного и первичного по ПБ',
				template: 'journal_intro_primary',
				placeholders: ['{{дата документа}}']
			},
			{
				key: 'LNNA_ACK',
				name: 'Лист ознакомления с ЛНА работником',
				template: 'lnna_ack',
				placeholders: [ '{{дата ознакомления с лна}}' ]
			},
			{
				key: 'LK_SIZ',
				name: 'ЛК СИЗ',
				template: 'lk_siz',
				placeholders: ['{{дата выдачи СИЗ}}']
			},
			{
				key: 'ORDER_INTERNSHIP',
				name: 'Приказ о стажировке',
				template: 'order_internship',
				placeholders: [
					'{{дата документа}}',
					'{{дата начала стажировки}}',
					'{{дата окончания стажировки}}'
				]
			},
			{
				key: 'INTERNSHIP_SHEET',
				name: 'Стажировочный лист',
				template: 'internship_sheet',
				placeholders: [
					'{{дата начала стажировки}}',
					'{{дата окончания стажировки}}'
				]
			},
			{
				key: 'REF_MEDICAL_EXAM',
				name: 'Направление на МО',
				template: 'ref_medical_exam',
				placeholders: [
					'{{дата документа}}',
					'{{наименование мед организации}}'
				]
			},
			{
				key: 'KNOWLEDGE_TESTING_PROTOCOL',
				name: 'Протокол проверки знаний',
				template: 'knowledge_testing_protocol',
				placeholders: [
					'{{дата документа}}'
				]
			}
		]
	},
	{
		group: 'organizations',
		templates: [
			{
				key: 'JOURNAL_MICRODAMAGE',
				name: 'Журнал Реестр учета микроповреждений',
				template: 'journal_microdamage'
			},
			{
				key: 'JOURNAL_ACCIDENTS',
				name: 'Журнал учета несчастных случаев',
				template: 'journal_accidents'
			},
			{
				key: 'IOT_FIRST_AID',
				name: 'ИОТ-ОППП-01 Первая помощь',
				template: 'iot_first_aid'
			},
			{
				key: 'IOT_SIZ',
				name: 'ИОТ-СИЗ-04 СИЗ',
				template: 'iot_siz'
			},
			{
				key: 'LIST_INSTRUCTIONS',
				name: 'Перечень инструкций',
				template: 'list_instructions'
			},
			{
				key: 'POLICY_SIZ',
				name: 'Положение об обеспечении СИЗ',
				template: 'policy_siz'
			},
			{
				key: 'POLICY_ACCIDENTS',
				name: 'Положение о несчастных случаях',
				template: 'policy_accidents'
			},
			{
				key: 'POLICY_TRAINING',
				name: 'Положение о порядке обучения ОТ',
				template: 'policy_training'
			},
			{
				key: 'POLICY_SUOT',
				name: 'Положение о СУОТ',
				template: 'policy_suot'
			},
			{
				key: 'ORDER_APPROVE_LNA',
				name: 'Приказ об утверждении ЛНА по ОТ',
				template: 'order_approve_lna'
			},
			{
				key: 'ORDER_SAN_POSTS',
				name: 'Приказ о сан постах',
				template: 'order_san_posts'
			},
			{
				key: 'ORDER_START_SUOT',
				name: 'Приказ о старте новой СУОТ',
				template: 'order_start_suot'
			},
			{
				key: 'ORDER_RESPONSIBLE_OT',
				name: 'Приказ ответственный за ОТ',
				template: 'order_responsible_ot'
			},
			{
				key: 'PROGRAM_SIZ_USAGE',
				name: 'Программа обучения по использованию СИЗ',
				template: 'program_siz_usage'
			},
			{
				key: 'PROGRAM_GENERAL_SUOT',
				name: 'Программа обучения по общим вопросам СУОТ',
				template: 'program_general_suot'
			},
			{
				key: 'PROGRAM_FIRST_AID',
				name: 'Программа обучения по оказанию первой помощи',
				template: 'program_first_aid'
			},
			{
				key: 'PROGRAM_HAZARD_FACTORS',
				name: 'Программа обучения при воздействии вредных и опасных факторов',
				template: 'program_hazard_factors'
			},
			{
				key: 'PROGRAM_WORKPLACE_INTERNSHIP',
				name: 'Программа стажировки на рабочем месте',
				template: 'program_workplace_internship'
			},
			{
				key: 'NORM_ISSUANCE_SIZ',
				name: 'Нормы выдачи СИЗ',
				template: 'norm_issuance_siz'
			}
		]
	}
];


export const TEMPLATES_BY_KEY = Object.fromEntries(
	TEMPLATES_GROUPED.flatMap(group =>
		group.templates
			.filter(t => t.key)
			.map(t => [t.key, t])
	)
);
