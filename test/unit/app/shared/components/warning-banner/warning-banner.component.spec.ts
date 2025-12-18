import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningBannerComponent } from '../../../../../../src/app/shared/components/warning-banner/warning-banner.component';

describe('WarningBannerComponent', () => {
  let component: WarningBannerComponent;
  let fixture: ComponentFixture<WarningBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarningBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
