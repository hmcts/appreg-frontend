import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryListCardActionComponent } from './summary-list-card-action.component';

describe('SummaryListCardActionComponent', () => {
  let component: SummaryListCardActionComponent;
  let fixture: ComponentFixture<SummaryListCardActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryListCardActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryListCardActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
