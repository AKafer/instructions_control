export const INITIAL_STATE = {
	valueIns: 0,
	subModalOpen: false,
	visibleDelButton: true,
	isValid: {
		title: true
	},
	values: {
		title: '',
		repeatable: false
	},
	errors: {
		title: ''
	},
	isFormReadyToSubmit: false
};

export function formReducer(state, action) {
	// eslint-disable-next-line default-case
	switch (action.type) {
	case 'SET_VALUE_Ins':
		return {...state, valueIns: action.payload};
	case 'SET_SUB_MODAL':
		return {...state, subModalOpen: action.payload};
	case 'SET_VISIBLE_DEL_BUTTON':
		return {...state, visibleDelButton: action.payload};
	case 'SET_VALUE':
		const valuesEntries = Object.entries(action.payload);
		const [nameV, valueV] = valuesEntries[0];
		if (
			(valueV === undefined || valueV === '') &&
			!(nameV in state.isValid)) {
			const rest = Object.keys(state.values).reduce((acc, key) => {
				if (key !== nameV) {
					acc[key] = state.values[key];
				}
				return acc;
			}, {});
			return {...state, values: rest};
		}
		return {...state, values: {...state.values, ...action.payload}};
	case 'CLEAR':
		return { ...state, values: INITIAL_STATE.values, isFormReadyToSubmit: false, errors: INITIAL_STATE.errors};
	case 'RESET_VALIDITY':
		return {...state, isValid: INITIAL_STATE.isValid, errors: INITIAL_STATE.errors};
	case 'SUBMIT': {
		console.log('submit');
		const titleValidity = Boolean(String(state.values.title || '').trim().length);
		return {
			...state,
			isValid: {
				title: titleValidity
			},
			errors: {
				title: titleValidity ? '' : 'Обязательное поле'
			},
			isFormReadyToSubmit: (titleValidity)
		};
	}
	default:
		return state;
	}
}