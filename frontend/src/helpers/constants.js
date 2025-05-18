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
export const getAllMaterialTypesUrl = '/material_types/';

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
	{ value: 'head_size', label: 'Перчатки' },
	{ value: 'mask_size', label: 'Для головы' },
	{ value: 'gloves_size', label: 'Перчатки' },
	{ value: 'mitten_size', label: 'Варежки' }
];
