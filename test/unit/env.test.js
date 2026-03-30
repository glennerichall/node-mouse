describe('env utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {...originalEnv};
    delete process.env.TEST_OPTIONAL_STRING;
    delete process.env.TEST_OPTIONAL_NUMBER;
    delete process.env.TEST_OPTIONAL_BOOLEAN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('readOptionalString returns undefined when env is absent', async () => {
    const {readOptionalString} = await import('../../server/utils/env.js');

    expect(readOptionalString('TEST_OPTIONAL_STRING')).toBeUndefined();
  });

  it('readOptionalString trims present env values', async () => {
    process.env.TEST_OPTIONAL_STRING = '  value  ';
    const {readOptionalString} = await import('../../server/utils/env.js');

    expect(readOptionalString('TEST_OPTIONAL_STRING')).toBe('value');
  });

  it('readOptionalNumber returns undefined when env is absent', async () => {
    const {readOptionalNumber} = await import('../../server/utils/env.js');

    expect(readOptionalNumber('TEST_OPTIONAL_NUMBER')).toBeUndefined();
  });

  it('readOptionalNumber parses present env values', async () => {
    process.env.TEST_OPTIONAL_NUMBER = '42';
    const {readOptionalNumber} = await import('../../server/utils/env.js');

    expect(readOptionalNumber('TEST_OPTIONAL_NUMBER')).toBe(42);
  });

  it('readOptionalBoolean returns undefined when env is absent', async () => {
    const {readOptionalBoolean} = await import('../../server/utils/env.js');

    expect(readOptionalBoolean('TEST_OPTIONAL_BOOLEAN')).toBeUndefined();
  });

  it('readOptionalBoolean parses present env values', async () => {
    process.env.TEST_OPTIONAL_BOOLEAN = 'true';
    const {readOptionalBoolean} = await import('../../server/utils/env.js');

    expect(readOptionalBoolean('TEST_OPTIONAL_BOOLEAN')).toBe(true);
  });
});
