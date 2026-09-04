import { ApplicationListGetPrintDto } from '@openapi';
import { ApplicationListPdfGenerator } from '@shared-types/pdf/pdf.types';
import {
  extractDuration,
  filterEntriesToPrint,
  formatDurationPart,
  handlePrintContinuous,
  handlePrintPage,
} from '@util/pdf-utils';

const makeDto = (entries: unknown[]): ApplicationListGetPrintDto =>
  ({
    date: '2026-04-29',
    time: '10:00',
    entries,
  }) as ApplicationListGetPrintDto;

const makePdf = (): jest.Mocked<ApplicationListPdfGenerator> => ({
  generatePagedApplicationListPdf: jest.fn(),
  generateContinuousApplicationListsPdf: jest.fn(),
});

describe('extractDuration', () => {
  it('strips zero minutes when the duration has non-zero hours', () => {
    expect(extractDuration({ duration: '2h 0m' })).toBe('2 Hours');
  });

  it('uses singular units and separates non-zero hours and minutes with a comma', () => {
    expect(extractDuration({ duration: '1h 1m' })).toBe('1 Hour, 1 Minute');
  });

  it('uses plural units for non-zero hours and minutes', () => {
    expect(extractDuration({ duration: '2h 30m' })).toBe('2 Hours, 30 Minutes');
  });
});

describe('formatDurationPart', () => {
  it.each([
    [1, 'Hour', '1 Hour'],
    [2, 'Hour', '2 Hours'],
    [1, 'Minute', '1 Minute'],
    [30, 'Minute', '30 Minutes'],
  ])('formats %i %s correctly', (value, unit, expected) => {
    expect(formatDurationPart(value, unit as 'Hour' | 'Minute')).toBe(expected);
  });
});

describe('filterEntriesToPrint', () => {
  it('returns only entries matching selected row ids', () => {
    const dto = makeDto([{ id: 'entry-1' }, { id: 'entry-2' }, { id: '3' }]);

    expect(
      filterEntriesToPrint(dto, [{ id: 'entry-1' }, { id: 3 }, { id: null }]),
    ).toEqual({
      ...dto,
      entries: [{ id: 'entry-1' }, { id: '3' }],
    });
  });

  it('returns an empty entries array when no selected ids match', () => {
    const dto = makeDto([{ id: 'entry-1' }]);

    expect(filterEntriesToPrint(dto, [])).toEqual({
      ...dto,
      entries: [],
    });
  });
});

describe('handlePrintPage', () => {
  it('reports an error and skips PDF generation when there are no entries', async () => {
    const pdf = makePdf();
    const onError = jest.fn();

    await handlePrintPage(makeDto([]), {
      pdf,
      isBrowser: true,
      onError,
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Retry',
    });

    expect(pdf.generatePagedApplicationListPdf).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('No entries');
  });

  it('generates a paged PDF in the browser', async () => {
    const dto = makeDto([{ id: 'entry-1' }]);
    const pdf = makePdf();

    await handlePrintPage(dto, {
      pdf,
      isBrowser: true,
      onError: jest.fn(),
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Retry',
      crestUrl: '/assets/govuk-crest.png',
    });

    expect(pdf.generatePagedApplicationListPdf).toHaveBeenCalledWith(dto, {
      crestUrl: '/assets/govuk-crest.png',
    });
  });

  it('generates a paged PDF from printable DTOs when multiple DTOs are provided', async () => {
    const printableDto = makeDto([{ id: 'entry-1' }]);
    const emptyDto = makeDto([]);
    const pdf = makePdf();

    await handlePrintPage([emptyDto, printableDto], {
      pdf,
      isBrowser: true,
      onError: jest.fn(),
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Retry',
    });

    expect(pdf.generatePagedApplicationListPdf).toHaveBeenCalledWith(
      [printableDto],
      undefined,
    );
  });

  it('reports the page generation error when PDF generation rejects', async () => {
    const pdf = makePdf();
    const onError = jest.fn();
    pdf.generatePagedApplicationListPdf.mockRejectedValueOnce(
      new Error('pdf failed'),
    );

    await handlePrintPage(makeDto([{ id: 'entry-1' }]), {
      pdf,
      isBrowser: true,
      onError,
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Retry',
    });

    expect(onError).toHaveBeenCalledWith('Retry');
  });
});

describe('handlePrintContinuous', () => {
  it('generates a continuous PDF with the closed-list flag', async () => {
    const dto = makeDto([{ id: 'entry-1' }]);
    const pdf = makePdf();

    await handlePrintContinuous(dto, {
      pdf,
      isBrowser: true,
      onError: jest.fn(),
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Generic error',
      isClosed: true,
    });

    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledWith(
      [dto],
      true,
    );
  });

  it('generates a continuous PDF from printable DTOs when multiple DTOs are provided', async () => {
    const printableDto = makeDto([{ id: 'entry-1' }]);
    const emptyDto = makeDto([]);
    const pdf = makePdf();

    await handlePrintContinuous([emptyDto, printableDto], {
      pdf,
      isBrowser: true,
      onError: jest.fn(),
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Generic error',
      isClosed: false,
    });

    expect(pdf.generateContinuousApplicationListsPdf).toHaveBeenCalledWith(
      [printableDto],
      false,
    );
  });

  it('does not generate a continuous PDF outside the browser', async () => {
    const pdf = makePdf();
    const onError = jest.fn();

    await handlePrintContinuous(makeDto([{ id: 'entry-1' }]), {
      pdf,
      isBrowser: false,
      onError,
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Generic error',
    });

    expect(pdf.generateContinuousApplicationListsPdf).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports the continuous generation error when PDF generation rejects', async () => {
    const pdf = makePdf();
    const onError = jest.fn();
    pdf.generateContinuousApplicationListsPdf.mockRejectedValueOnce(
      new Error('pdf failed'),
    );

    await handlePrintContinuous(makeDto([{ id: 'entry-1' }]), {
      pdf,
      isBrowser: true,
      onError,
      noEntriesMessage: 'No entries',
      generateErrorMessage: 'Generic error',
    });

    expect(onError).toHaveBeenCalledWith('Generic error');
  });
});
