import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsResultSelectedComponent } from '@components/applications/applications-result-selected/applications-result-selected.component';

describe('ApplicationsResultSelectedComponent', () => {
  let component: ApplicationsResultSelectedComponent;
  let fixture: ComponentFixture<ApplicationsResultSelectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsResultSelectedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsResultSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
