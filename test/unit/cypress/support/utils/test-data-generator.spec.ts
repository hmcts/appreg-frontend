import { TestDataGenerator } from '../../../../../cypress/support/utils/TestDataGenerator';

describe('TestDataGenerator', () => {
  afterEach(() => {
    TestDataGenerator.resetScenario();
    jest.restoreAllMocks();
  });

  it('uses one six-digit value throughout a scenario', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1785966036223);

    TestDataGenerator.initializeScenario();

    expect(
      TestDataGenerator.replaceRandomPlaceholders('Test {RANDOM}-{RANDOM}'),
    ).toBe('Test 036223-036223');
  });

  it('does not repeat a token when timestamps share the same final four digits', () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1785965996257);
    TestDataGenerator.initializeScenario();
    const firstToken = TestDataGenerator.replaceRandomPlaceholders('{RANDOM}');

    TestDataGenerator.resetScenario();
    jest.spyOn(Date, 'now').mockReturnValueOnce(1785966036223);
    TestDataGenerator.initializeScenario();

    expect(firstToken).toBe('996257');
    expect(TestDataGenerator.replaceRandomPlaceholders('{RANDOM}')).toBe(
      '036223',
    );
  });

  it('uses one longer identifier throughout a scenario', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1785966036223);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    TestDataGenerator.initializeScenario();

    expect(
      TestDataGenerator.replaceRandomPlaceholders(
        'Test {SCENARIO_ID}-{SCENARIO_ID}',
      ),
    ).toBe('Test msgm2d4v-aaaaaaaa-msgm2d4v-aaaaaaaa');
  });
});
