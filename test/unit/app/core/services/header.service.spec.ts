import { HeaderService } from '@services/header.service';

describe('HeaderService', () => {
  it('starts visible', () => {
    const service = new HeaderService();
    expect(service.isVisible()).toBe(true);
  });

  it('hideNavigation sets isVisible to false', () => {
    const service = new HeaderService();
    service.hideNavigation();
    expect(service.isVisible()).toBe(false);
  });

  it('showNavigation sets isVisible to true', () => {
    const service = new HeaderService();
    service.hideNavigation();
    expect(service.isVisible()).toBe(false);

    service.showNavigation();
    expect(service.isVisible()).toBe(true);
  });

  it('last call wins when hide then show are called', () => {
    const service = new HeaderService();
    service.hideNavigation();
    expect(service.isVisible()).toBe(false);
    service.showNavigation();
    expect(service.isVisible()).toBe(true);
  });
});
