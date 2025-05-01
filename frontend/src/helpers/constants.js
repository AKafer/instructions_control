// export const PREFIX = 'http://0.0.0.0:8700';

// export const PREFIX = '';

export const PREFIX = process.env.REACT_APP_API_URL || '';
export const JWT_STORAGE_KEY = 'jwt';
export const EMAIL_STORAGE_KEY = 'email';

export const getAllProfessionsUrl = '/api/v1/professions/';
export const getAllDivisionsUrl = '/api/v1/divisions/';
export const getAllRulesUrl = '/api/v1/rules/';
export const getAllInstructionsUrl = '/api/v1/instructions/';
export const getAllUsersUrl = '/api/v1/users';

export const deleteUserUrl = getAllUsersUrl;

export const registerUrl = '/api/v1/auth/register';