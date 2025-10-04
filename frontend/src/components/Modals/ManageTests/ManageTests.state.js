export const nullTestOption = { value: 0, label: '---Создать новый тест---' };

export const INITIAL_STATE = {
	valueTest: nullTestOption,
	subModalOpen: false,
	visibleDelButton: true,
	isValid: {
		title: true,
		success_rate: true
	},
	values: {
		title: '',
		description: '',
		success_rate: '',
		valueIns: null
	},
	errors: {
		title: '',
		success_rate: ''
	},
	isFormReadyToSubmit: false
};

export function formReducer(state, action) {
	switch (action.type) {
	case 'SET_VALUE_TEST':
		return { ...state, valueTest: action.payload };

	case 'SET_SUB_MODAL':
		return { ...state, subModalOpen: action.payload };

	case 'SET_VISIBLE_DEL_BUTTON':
		return { ...state, visibleDelButton: action.payload };

	case 'SET_VALUE': {
		const entries = Object.entries(action.payload);
		const [nameV, valueV] = entries[0];

		if ((valueV === undefined || valueV === '') && !(nameV in state.isValid)) {
			const rest = Object.keys(state.values).reduce((acc, key) => {
				if (key !== nameV) acc[key] = state.values[key];
				return acc;
			}, {});
			return { ...state, values: rest };
		}
		return { ...state, values: { ...state.values, ...action.payload } };
	}

	case 'CLEAR':
		return {
			...state,
			values: INITIAL_STATE.values,
			isFormReadyToSubmit: false,
			errors: INITIAL_STATE.errors
		};

	case 'RESET_VALIDITY':
		return { ...state, isValid: INITIAL_STATE.isValid, errors: INITIAL_STATE.errors };

	case 'SUBMIT': {
		const titleValidity = Boolean(String(state.values.title || '').trim().length);

		// success_rate: число 0..100
		const srRaw = String(state.values.success_rate ?? '').trim();
		const srNum = Number(srRaw);
		const srValidity = srRaw !== '' && Number.isFinite(srNum) && srNum >= 0 && srNum <= 100;

		return {
			...state,
			isValid: {
				title: titleValidity,
				success_rate: srValidity
			},
			errors: {
				title: titleValidity ? '' : 'Обязательное поле',
				success_rate: srValidity ? '' : 'Число от 0 до 100'
			},
			isFormReadyToSubmit: (titleValidity && srValidity)
		};
	}

	case 'SET_SUBMIT_FALSE':
		return { ...state, isFormReadyToSubmit: false };

	default:
		return state;
	}
}
