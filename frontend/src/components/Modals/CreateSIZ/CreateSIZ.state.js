const today = new Date().toISOString().slice(0, 10);

const toIntOrDefault = (v, def, min = 1) => {
	const n = Number(v);
	if (!Number.isFinite(n)) return def;
	const i = Math.trunc(n);
	return i < min ? min : i;
};

const normalizeDate = (v, fallback) => {
	const s = String(v ?? '').trim();
	return Number.isNaN(Date.parse(s)) ? fallback : s;
};

const toKeyOrNull = (v) =>
	v === null || v === undefined || v === '' ? null : String(v);

export const INITIAL_STATE = {
	isValid: {
		user_id: true,
		material_type_id: true,
		quantity: true,
		start_date: true,
		period: true
	},
	values: {
		user_id: null,
		material_type_id: null,
		quantity: 1,
		start_date: today,
		period: 365,
		sertificate: '',
		number_of_document: ''
	},
	isFormReadyToSubmit: false
};


export function formReducer(state, action) {
	switch (action.type) {
	case 'SET_VALUE': {
		return { ...state, values: { ...state.values, ...action.payload } };
	}

	case 'SET_FROM_SIZ': {
		const fromSiz = Array.isArray(action.payload)
			? Object.fromEntries(action.payload)
			: (action.payload || {});

		const nextValues = {
			user_id: toKeyOrNull(fromSiz.user_id ?? state.values.user_id),
			material_type_id: toKeyOrNull(fromSiz.material_type_id ?? state.values.material_type_id),
			quantity: toIntOrDefault(fromSiz.quantity ?? state.values.quantity, 1, 1),
			start_date: normalizeDate(fromSiz.start_date ?? state.values.start_date, today),
			period: toIntOrDefault(fromSiz.period ?? state.values.period, 365, 1),
			sertificate: fromSiz.sertificate ?? state.values.sertificate ?? '',
			number_of_document: fromSiz.number_of_document ?? state.values.number_of_document ?? ''
		};

		return {
			...state,
			values: nextValues,
			isValid: {
				...state.isValid,
				user_id: nextValues.user_id != null && nextValues.user_id !== 0,
				material_type_id: nextValues.material_type_id != null && nextValues.material_type_id !== 0,
				quantity: Number.isFinite(Number(nextValues.quantity)) && Number(nextValues.quantity) >= 1,
				start_date: !Number.isNaN(Date.parse(String(nextValues.start_date))),
				period: Number.isFinite(Number(nextValues.period)) && Number(nextValues.period) >= 1
			}
		};
	}


	case 'CLEAR': {
		return { ...state, values: INITIAL_STATE.values, isFormReadyToSubmit: false };
	}

	case 'RESET_VALIDITY': {
		return { ...state, isValid: INITIAL_STATE.isValid };
	}

	case 'SET_VALIDITY_FOR_FIELD': {
		return { ...state, isValid: { ...state.isValid, [action.payload]: true } };
	}

	case 'SUBMIT': {
		const nextValues = {
			...state.values,
			quantity: toIntOrDefault(state.values.quantity, 1, 1),
			period: toIntOrDefault(state.values.period, 365, 1),
			start_date: normalizeDate(state.values.start_date, today)
		};

		const user_idValidity =
        nextValues.user_id !== undefined &&
        nextValues.user_id !== null &&
        nextValues.user_id !== '' &&
        nextValues.user_id !== 0;

		const material_type_idValidity =
        nextValues.material_type_id !== undefined &&
        nextValues.material_type_id !== null &&
        nextValues.material_type_id !== '' &&
        nextValues.material_type_id !== 0;

		const quantityValidity = Number.isFinite(Number(nextValues.quantity)) && Number(nextValues.quantity) >= 1;
		const start_dateValidity = !Number.isNaN(Date.parse(String(nextValues.start_date)));
		const periodValidity = Number.isFinite(Number(nextValues.period)) && Number(nextValues.period) >= 1;

		const isFormReadyToSubmit =
        user_idValidity && material_type_idValidity && quantityValidity && start_dateValidity && periodValidity;

		return {
			...state,
			values: nextValues,
			isValid: {
				user_id: user_idValidity,
				material_type_id: material_type_idValidity,
				quantity: quantityValidity,
				start_date: start_dateValidity,
				period: periodValidity
			},
			isFormReadyToSubmit
		};
	}

	default:
		return state;
	}
}