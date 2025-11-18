import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateProsecutorsIndexSectionComponent } from '../../../../../../src/app/shared/components/private-prosecutors-index-section/private-prosecutors-index-section.component';

describe('PrivateProsecutorsIndexSectionComponent', () => {
  let component: PrivateProsecutorsIndexSectionComponent;
  let fixture: ComponentFixture<PrivateProsecutorsIndexSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateProsecutorsIndexSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivateProsecutorsIndexSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});