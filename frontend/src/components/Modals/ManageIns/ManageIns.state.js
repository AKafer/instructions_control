export const nullOption = {value: 0, label: '---Создать новую инструкцию---'};

export const INITIAL_STATE = {
	valueIns: nullOption,
	valueProf: null,
	optionsUnBindedProf: [],
	subModalOpen: false,
	visibleDelButton: true,
	isValid: {
		title: true,
		file: true
	},
	values: {
		title: '',
		repeatable: false,
		file: null
	},
	errors: {
		title: ''
	},
	isFormReadyToSubmit: false
};

function isEqualJSON(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function formReducer(state, action) {
	// eslint-disable-next-line default-case
	switch (action.type) {
	case 'SET_VALUE_optionsUnBindedProf':
		return {...state, optionsUnBindedProf: action.payload};
	case 'SET_VALUE_Ins':
		return {...state, valueIns: action.payload};
	case 'SET_VALUE_Prof':
		return {...state, valueProf: action.payload};
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
		return {
			...state,
			values: INITIAL_STATE.values,
			isFormReadyToSubmit: false,
			subModalOpen: false,
			errors: INITIAL_STATE.errors,
			valueIns: nullOption,
			valueProf: null,
			optionsUnBindedProf: []
		};
	case 'RESET_VALIDITY':
		return {...state, isValid: INITIAL_STATE.isValid, errors: INITIAL_STATE.errors};
	case 'SUBMIT': {
		const titleValidity = Boolean(String(state.values.title || '').trim().length);
		const fileValidity = Boolean(state.values.file != null || !isEqualJSON(state.valueIns, nullOption));
		console.log('fileValidity', fileValidity);
		return {
			...state,
			isValid: {
				title: titleValidity,
				file: fileValidity
			},
			errors: {
				title: titleValidity ? '' : 'Обязательное поле'
			},
			isFormReadyToSubmit: (titleValidity && fileValidity)
		};
	}
	case 'SET_SUBMIT_FALSE':
		return {
			...state,
			isFormReadyToSubmit: false
		};
	default:
		return state;
	}
}