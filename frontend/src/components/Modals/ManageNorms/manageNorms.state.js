export const INITIAL_STATE = {
	subModalOpen: false,
	visibleDelButton: true,
	checkedNormsType: false,
	isValid: {
		title: true
	},
	values: {
		title: ''
	},
	errors: {
		title: ''
	}
};

export function formReducer(state, action) {
	// eslint-disable-next-line default-case
	switch (action.type) {
	case 'SET_VALUE_NORM':
		return {...state, valueNorm: action.payload};
	case 'SET_SUB_MODAL':
		return {...state, subModalOpen: action.payload};
	case 'SET_VISIBLE_DEL_BUTTON':
		return {...state, visibleDelButton: action.payload};
	case 'SET_CHECKED_NORMS_TYPE':
		return {...state, checkedNormsType: action.payload};
	case 'SET_VALUE':
		return {
			...state,
			values: {
				...state.values,
				...action.payload
			}
		};
	case 'CLEAR':
		return { ...state, values: INITIAL_STATE.values, isFormReadyToSubmit: false, errors: INITIAL_STATE.errors};
	case 'RESET_VALIDITY':
		return {...state, isValid: INITIAL_STATE.isValid, errors: INITIAL_STATE.errors};
	case 'SUBMIT': return {...state};
	default:
		return state;
	}
}