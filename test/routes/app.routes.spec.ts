import { routes } from '../../src/app/app.routes';

describe('App Routes', () => {
  it('should be defined', () => {
    expect(routes).toBeDefined();
  });

  it('should be an array', () => {
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should start empty', () => {
    expect(routes).toHaveLength(0);
  });
});
