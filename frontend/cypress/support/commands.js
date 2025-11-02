Cypress.Commands.add('login', (email, password) => {
	cy.get('input[id="email"]').type(email);
	cy.get('input[id="password"]').type(password);
	cy.get('[data-testid="nav-login-button"]').should('exist').and('be.visible');
	cy.get('button[data-testid="nav-login-button"]').click();
});