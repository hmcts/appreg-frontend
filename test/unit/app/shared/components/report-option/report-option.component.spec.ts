import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportSelectorComponent } from '../../../../../../src/app/shared/components/report-option/report-selector.component';

describe('ReportSelectorComponent', () => {
  let component: ReportSelectorComponent;
  let fixture: ComponentFixture<ReportSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});