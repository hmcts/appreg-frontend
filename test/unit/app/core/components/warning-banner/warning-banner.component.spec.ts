import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningBannerComponent } from '@components/warning-banner/warning-banner.component';

describe('WarningBannerComponent', () => {
  let component: WarningBannerComponent;
  let fixture: ComponentFixture<WarningBannerComponent>;

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarningBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningBannerComponent);
    component = fixture.componentInstance;
    setInput('message', 'Warning');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
