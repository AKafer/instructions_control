import React from 'react';
import Select from 'react-select';


export function CustomSelect({options, value, placeholder, onChange}) {
	return (
		<Select classNamePrefix="custom-select"
			options={options}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			styles={{
				control: (base) => ({
					...base,
					minHeight: '60px',
					minWidth: '300px',
					borderRadius: '10px',
					backgroundColor: '#fff',
					border: '1px solid var(--color_element_border)',
					boxShadow: 'none',
					'&:hover': {
						border: '1px solid #888'
					}
				}),
				singleValue: (base) => ({
					...base,
					color: 'var(--color_text_default)',
					fontSize: '17px',
					fontStyle: 'normal',
					fontWeight: 400,
					fontFamily: '"Noto Sans", sans-serif'
				}),
				placeholder: (base) => ({
					...base,
					color: 'var(--color_text_default_trans)',
					fontSize: '17px',
					fontStyle: 'normal',
					fontWeight: 400,
					fontFamily: '"Noto Sans", sans-serif'

				}),
				 option: (base) => ({
					...base,
					color: 'var(--color_text_default)',
					fontSize: '17px',
					fontStyle: 'normal',
					fontWeight: 400,
					fontFamily: '"Noto Sans", sans-serif'
				}),
				menu: (base) => ({
					...base,
					zIndex: 9999
				})
			}}
		/>
	);
}
