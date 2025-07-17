import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationViewComponent } from './application-view.component';

describe('ApplicationViewComponent', () => {
  let component: ApplicationViewComponent;
  let fixture: ComponentFixture<ApplicationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
