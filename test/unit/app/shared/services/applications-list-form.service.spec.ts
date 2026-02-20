import { ApplicationsListFormService } from '@services/applications-list/applications-list-form.service';

describe('ApplicationsListFormService', () => {
  let service: ApplicationsListFormService;

  beforeEach(() => {
    service = new ApplicationsListFormService();
  });

  it('builds search form with expected defaults', () => {
    const form = service.createSearchForm();

    expect(form.updateOn).toBe('change');
    expect(form.controls.date.value).toBeNull();
    expect(form.controls.time.value).toBeNull();
    expect(form.controls.description.value).toBe('');
    expect(form.controls.status.value).toBeNull();
    expect(form.controls.court.value).toBe('');
    expect(form.controls.location.value).toBe('');
    expect(form.controls.cja.value).toBe('');
  });

  it('builds create form with submit updateOn and default status', () => {
    const form = service.createCreateForm();

    expect(form.updateOn).toBe('submit');
    expect(form.controls.status.value).toBe('open');
    expect(form.controls.date.updateOn).toBe('submit');
    expect(form.controls.time.updateOn).toBe('submit');
    expect(form.controls.description.updateOn).toBe('submit');
    expect(form.controls.court.updateOn).toBe('change');
    expect(form.controls.location.updateOn).toBe('change');
    expect(form.controls.cja.updateOn).toBe('change');
  });
});
