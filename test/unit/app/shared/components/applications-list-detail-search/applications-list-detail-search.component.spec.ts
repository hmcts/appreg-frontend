import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListDetailSearchComponent } from '@components/applications-list-detail-search/applications-list-detail-search.component';

describe('ApplicationsListDetailSearchComponent', () => {
  let component: ApplicationsListDetailSearchComponent;
  let fixture: ComponentFixture<ApplicationsListDetailSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetailSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetailSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
