import React from 'react';
import Select from 'react-select';


export function SelectForm({options, value, placeholder, onChange, isValid}) {
	return (
		<Select classNamePrefix="custom-select"
			options={options}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			styles={{
				control: (base) => ({
					...base,
					minWidth: '300px',
					maxWidth: '300px',
					borderRadius: '10px',
					backgroundColor: '#fff',
					border: isValid === false
						? '2px solid var(--invalid_element_border)'
						: '1px solid var(--color_element_border)',
					boxShadow: 'none',
					'&:hover': {
						border: isValid === false
							? '2px solid var(--invalid_element_border)'
							: '1px solid #888'
					},
					...(isValid === false && { background: 'var(--invalid_elemen_background)' })
				}),
				singleValue: (base) => ({
					...base,
					color: 'var(--color_text_default)',
					fontSize: '13px',
					fontStyle: 'normal',
					fontWeight: 400,
					fontFamily: '"Noto Sans", sans-serif'
				}),
				placeholder: (base) => ({
					...base,
					color: 'var(--color_text_default_trans)',
					fontSize: '13px',
					fontStyle: 'normal',
					fontWeight: 400,
					fontFamily: '"Noto Sans", sans-serif'

				}),
				 option: (base) => ({
					...base,
					color: 'var(--color_text_default)',
					fontSize: '13px',
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
