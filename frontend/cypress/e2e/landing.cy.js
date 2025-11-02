describe('Landing page', () => {
	beforeEach(() => {
		cy.visit('/');
	});

	it('Show main branding', () => {
		cy.contains('Ваш надежный партнер в управлении учетными данными');
	});

	it('Go to login page if click button "Начать работу"', () => {
		cy.get('button[data-testid="nav-start-button"]').click();
		cy.url().should('include', '/login');
		cy.contains('Ваш email').should('exist');
		cy.contains('Ваш пароль').should('exist');
		cy.contains('Вход').should('exist');
	});

});