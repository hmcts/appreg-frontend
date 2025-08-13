<<<<<<< HEAD
import { routes } from "../../app/app.routes";

describe("App Routes", () => {
  it("should be defined", () => {
    expect(routes).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(routes)).toBe(true);
  });

  it("should start empty", () => {
=======
import { routes } from '../../app/app.routes';

describe('App Routes', () => {
  it('should be defined', () => {
    expect(routes).toBeDefined();
  });

  it('should be an array', () => {
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should start empty', () => {
>>>>>>> 38048e2 (Rebasing Code)
    expect(routes).toHaveLength(0);
  });
});
