import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnDef, TableComponent } from '@components/table/table.component';

type Row = {
  applicants: string;
  respondents: string;
  title: string;
  person?: { name?: string };
};

describe('TableComponent (class tests)', () => {
  let fixture: ComponentFixture<TableComponent<Row>>;
  let comp: TableComponent<Row>;

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent<Row>);
    comp = fixture.componentInstance;
  });

  it('returns provided columns when set', () => {
    const provided: ColumnDef<Row>[] = [
      { header: 'Applicants', field: 'applicants' },
      { header: 'Respondents', field: 'respondents' },
    ];

    setInput('columns', provided, false);
    setInput(
      'rows',
      [{ applicants: 'A', respondents: 'B', title: 'T' }],
      false,
    );
    fixture.detectChanges();

    // cols should be exactly what we provided (no auto-gen)
    expect(comp.cols).toBe(provided);
  });

  it('auto-generates columns from first row when none provided', () => {
    setInput('columns', [], false);
    setInput('autoGenerateColumns', true, false);
    setInput(
      'rows',
      [{ applicants: 'A', respondents: 'B', title: 'T' }],
      false,
    );
    fixture.detectChanges();

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
    setInput('columns', [], false);
    setInput('autoGenerateColumns', false, false);
    setInput(
      'rows',
      [{ applicants: 'A', respondents: 'B', title: 'T' }],
      false,
    );
    fixture.detectChanges();

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
