import 'jest-preset-angular/setup-jest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
