import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveConfirmComponent } from '@components/applications-list-detail/applications-list-entry-move/move-confirm/move-confirm.component';

describe('MoveConfirmComponent', () => {
  let component: MoveConfirmComponent;
  let fixture: ComponentFixture<MoveConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveConfirmComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
