import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RespondentBulkApplicationComponent } from '@components/respondent-bulk-application/respondent-bulk-application.component';

describe('RespondentBulkApplicationComponent', () => {
  let component: RespondentBulkApplicationComponent;
  let fixture: ComponentFixture<RespondentBulkApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RespondentBulkApplicationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RespondentBulkApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
