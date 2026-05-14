import { routes } from '../../../src/app/app.routes';

describe('app.routes', () => {
  it('lazy loads top-level feature routes', () => {
    const applicationsRoute = routes.find(
      (route) => route.path === 'applications',
    );
    const standardApplicantsRoute = routes.find(
      (route) => route.path === 'standard-applicants',
    );
    const reportsRoute = routes.find((route) => route.path === 'reports');

    expect(applicationsRoute?.loadComponent).toBeDefined();
    expect(applicationsRoute?.component).toBeUndefined();

    expect(standardApplicantsRoute?.loadComponent).toBeDefined();
    expect(standardApplicantsRoute?.component).toBeUndefined();

    expect(reportsRoute?.loadComponent).toBeDefined();
    expect(reportsRoute?.component).toBeUndefined();
  });

  it('lazy loads applications-list pages that were previously eager', () => {
    const applicationsListRoute = routes.find(
      (route) => route.path === 'applications-list',
    );
    const childRoutes = applicationsListRoute?.children ?? [];

    const indexRoute = childRoutes.find((route) => route.path === '');
    const detailRoute = childRoutes.find((route) => route.path === ':id');
    const createEntryRoute = childRoutes.find(
      (route) => route.path === ':id/create-entry',
    );
    const updateEntryRoute = childRoutes.find(
      (route) => route.path === ':id/update-entry/:entryId',
    );

    expect(indexRoute?.loadComponent).toBeDefined();
    expect(indexRoute?.component).toBeUndefined();

    expect(detailRoute?.loadComponent).toBeDefined();
    expect(detailRoute?.component).toBeUndefined();

    expect(createEntryRoute?.loadComponent).toBeDefined();
    expect(createEntryRoute?.component).toBeUndefined();

    expect(updateEntryRoute?.loadComponent).toBeDefined();
    expect(updateEntryRoute?.component).toBeUndefined();
  });
});
