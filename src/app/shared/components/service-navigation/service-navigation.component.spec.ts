import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceNavigationComponent } from './service-navigation.component';

describe('ServiceNavigationComponent', () => {
  let component: ServiceNavigationComponent;
  let fixture: ComponentFixture<ServiceNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceNavigationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
