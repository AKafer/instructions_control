import React from 'react';
import Select from 'react-select';

export function CustomSelect({ options, value, placeholder, onChange, width }) {
	const customStyles = {
		control: (base, state) => ({
			...base,
			minHeight: '60px',
			minWidth: width || '300px',
			maxWidth: width || '300px',
			borderRadius: '10px',
			backgroundColor: '#fff',
			border: state.isFocused
				? '1px solid var(--color_primary_default)'
				: '1px solid var(--color_element_border)',
			boxShadow: state.isFocused ? '0 0 0 1px var(--color_primary_default)' : 'none',
			'&:hover': {
				border: state.isFocused
					? '1px solid var(--color_primary_default)'
					: '1px solid #888'
			}
		}),
		singleValue: (base) => ({
			...base,
			color: 'var(--color_text_default)',
			fontSize: '17px',
			fontFamily: '"Noto Sans", sans-serif'
		}),
		placeholder: (base) => ({
			...base,
			color: 'var(--color_text_default_trans)',
			fontSize: '17px',
			fontFamily: '"Noto Sans", sans-serif'
		}),
		option: (base) => ({
			...base,
			color: 'var(--color_text_default)',
			fontSize: '17px',
			fontFamily: '"Noto Sans", sans-serif'
		}),
		menu: (base) => ({
			...base,
			zIndex: 9999
		})
	};

	return (
		<Select
			classNamePrefix="custom-select"
			options={options}
			value={value}
			placeholder={placeholder}
			onChange={onChange}
			styles={customStyles}
		/>
	);
}

