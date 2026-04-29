import { ApplicationListGetPrintDto } from '@openapi';
import { ApplicationListPdfGenerator } from '@shared-types/pdf/pdf.types';
import {
  filterEntriesToPrint,
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
