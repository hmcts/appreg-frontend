import { ColumnDef, TableComponent } from '@components/table/table.component';

type Row = {
  applicants: string;
  respondents: string;
  title: string;
  person?: { name?: string };
};

describe('TableComponent (class tests)', () => {
  let comp: TableComponent<Row>;

  beforeEach(() => {
    comp = new TableComponent<Row>();
  });

  it('returns provided columns when set', () => {
    const provided: ColumnDef<Row>[] = [
      { header: 'Applicants', field: 'applicants' },
      { header: 'Respondents', field: 'respondents' },
    ];

    comp.columns = provided;
    comp.rows = [{ applicants: 'A', respondents: 'B', title: 'T' }];

    // cols should be exactly what we provided (no auto-gen)
    expect(comp.cols).toBe(provided);
  });

  it('auto-generates columns from first row when none provided', () => {
    comp.columns = [];
    comp.autoGenerateColumns = true;
    comp.rows = [{ applicants: 'A', respondents: 'B', title: 'T' }];

    const cols = comp.cols;
    expect(cols.map((c) => c.header)).toEqual([
      'Applicants',
      'Respondents',
      'Title',
    ]);
    expect(cols.map((c) => c.field)).toEqual([
      'applicants',
      'respondents',
      'title',
    ]);
  });

  it('does not auto-generate when autoGenerateColumns=false', () => {
    comp.columns = [];
    comp.autoGenerateColumns = false;
    comp.rows = [{ applicants: 'A', respondents: 'B', title: 'T' }];

    expect(comp.cols).toEqual([]);
  });

  it('valueOf supports function accessor', () => {
    const col: ColumnDef<Row> = {
      header: 'Fn',
      field: (row, i) => `${row.title}-${i}`,
    };
    const row: Row = { applicants: 'A', respondents: 'B', title: 'T' };

    expect(comp.valueOf(row, col, 3)).toBe('T-3');
  });

  it('valueOf supports direct key accessor', () => {
    const col: ColumnDef<Row> = {
      header: 'Applicants',
      field: 'applicants',
    };
    const row: Row = { applicants: 'AAA', respondents: 'B', title: 'T' };

    expect(comp.valueOf(row, col, 0)).toBe('AAA');
  });

  it('valueOf supports dotted path accessor', () => {
    const col: ColumnDef<Row> = { header: 'Name', field: 'person.name' };
    const row: Row = {
      applicants: 'A',
      respondents: 'B',
      title: 'T',
      person: { name: 'Zac' },
    };

    expect(comp.valueOf(row, col, 0)).toBe('Zac');
  });

  it('valueOf returns undefined when dotted path is missing', () => {
    const col: ColumnDef<Row> = { header: 'Name', field: 'person.name' };
    const row: Row = {
      applicants: 'A',
      respondents: 'B',
      title: 'T',
      person: {},
    };

    expect(comp.valueOf(row, col, 0)).toBeUndefined();
  });

  it('valueOf without accessor returns the whole row', () => {
    const col: ColumnDef<Row> = { header: 'Row' };
    const row: Row = { applicants: 'A', respondents: 'B', title: 'T' };

    expect(comp.valueOf(row, col, 1)).toBe(row);
  });
});
