describe('Авторизация (e2e)', () => {
	beforeEach(() => {
		cy.visit('/login');
	});

	it('Логинится как админ и попадает на дашборд', () => {
		const email = Cypress.env('ADMIN_EMAIL');
		const password = Cypress.env('ADMIN_PASSWORD');
		expect(email, 'ADMIN_EMAIL must be set').to.be.a('string').and.not.be.empty;
		expect(password, 'ADMIN_PASSWORD must be set').to.be.a('string').and.not.be.empty;

		cy.login(email, password);
		cy.url().should('include', '/admin');
		cy.contains('Сотрудники').should('exist');
		cy.contains('Обучение').should('exist');
		cy.contains('СИЗ').should('exist');
	});
});
