import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationCodesComponent } from './application-codes.component';

describe('ApplicationCodesComponent', () => {
  let component: ApplicationCodesComponent;
  let fixture: ComponentFixture<ApplicationCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCodesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
