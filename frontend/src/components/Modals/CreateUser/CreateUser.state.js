export const INITIAL_STATE = {
	isValid: {
		email: true,
		name: true,
		last_name: true,
		profession_id: true,
		division_id: true
	},
	values: {
		email: '',
		name: '',
		last_name: '',
		profession_id: null,
		division_id: null
	},
	additional_features: {},
	isFormReadyToSubmit: false
};


export function formReducer(state, action) {
	// eslint-disable-next-line default-case
	switch (action.type) {
	case 'SET_FROM_USER': {
		const payloadEntries = action.payload.filter(
			(entry) => Array.isArray(entry) && entry.length === 2
		);

		const userValues = payloadEntries
			.filter(([key]) => key !== 'additional_features' && key !== 'id')
			.map(([key, value]) => {
				if (
					(key === 'date_of_birth' || key === 'started_work' || key === 'changed_profession') &&
        typeof value === 'string'
				) {
					return [key, value.split('T')[0]];
				}
				return [key, value];
			});

		const additionalFeaturesEntry = payloadEntries.find(
			([key]) => key === 'additional_features'
		);
		const additionalFeaturesUser =
    additionalFeaturesEntry &&
    additionalFeaturesEntry[1] &&
    typeof additionalFeaturesEntry[1] === 'object'
    	? Object.entries(additionalFeaturesEntry[1]).filter(
    		(entry) => Array.isArray(entry) && entry.length === 2
    	)
    	: [];

		return {
			...state,
			values: {
				...state.values,
				...Object.fromEntries(userValues)
			},
			additional_features: {
				...state.additional_features,
				...Object.fromEntries(additionalFeaturesUser)
			}
		};
	}
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
	case 'SET_ADDITIONAL_FEATURE':
		const fatureEntries = Object.entries(action.payload);
		const [nameF, valueF] = fatureEntries[0];
		if (valueF === undefined || valueF === '') {
			const rest = Object.keys(state.additional_features).reduce((acc, key) => {
				if (key !== nameF) {
					acc[key] = state.additional_features[key];
				}
				return acc;
			}, {});
			return {...state, additional_features: rest};
		}
		return {...state, additional_features: {...state.additional_features, ...action.payload}};
	case 'CLEAR':
		return { ...state, values: INITIAL_STATE.values, isFormReadyToSubmit: false};
	case 'RESET_VALIDITY':
		return {...state, isValid: INITIAL_STATE.isValid};
	case 'SET_VALIDITY_FOR_FIELD':
		return {
			...state,
			isValid: {
				...state.isValid,
				[action.payload]: true
			}
		};
	case 'SUBMIT': {
		const emailValidity = String(state.values.email || '').trim().length;
		const nameValidity = String(state.values.name || '').trim().length;
		const last_nameValidity = String(state.values.last_name || '').trim().length;
		const profession_idValidity = (
			state.values.profession_id !== undefined &&
			state.values.profession_id !== 0 &&
			state.values.profession_id !== null &&
			state.values.profession_id !== ''
		);
		const division_idValidity = (
			state.values.division_id !== undefined &&
			state.values.division_id !== 0 &&
			state.values.division_id !== null &&
			state.values.division_id !== ''
		);

		return {
			...state,
			isValid: {
				email: emailValidity,
				name: nameValidity,
				last_name: last_nameValidity,
				profession_id: profession_idValidity,
				division_id: division_idValidity
			},
			isFormReadyToSubmit: (
				emailValidity &&
				nameValidity &&
				last_nameValidity &&
				profession_idValidity &&
				division_idValidity
			)
		};
	}
	}
}