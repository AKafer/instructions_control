import styles from './NormCalc.module.css';


export function NormCalc({selectedTypeMaterial}) {

	console.log('props в NormCalc:', selectedTypeMaterial);
	return (
		<div className={styles.calc}>
			{selectedTypeMaterial.id}--{selectedTypeMaterial.name}--{selectedTypeMaterial.norm}--{selectedTypeMaterial.given}--{selectedTypeMaterial.need}
		</div>
	);
}