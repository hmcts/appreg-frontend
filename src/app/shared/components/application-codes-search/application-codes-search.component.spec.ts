import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { ApplicationCodeSearchComponent } from './application-codes-search.component';

import { ApplicationCodesApi } from '@openapi';
import { CodeRow } from '@util/application-code-helpers';

describe('ApplicationCodeSearchComponent', () => {
  let fixture: ComponentFixture<ApplicationCodeSearchComponent>;
  let component: ApplicationCodeSearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCodeSearchComponent],
      providers: [
        {
          provide: ApplicationCodesApi,
          useValue: {},
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'list-123' }),
            },
          },
        },
      ],
    })
      .overrideComponent(ApplicationCodeSearchComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationCodeSearchComponent);
    component = fixture.componentInstance;
  });

  it('disables the lodgement date control when requested by the parent', () => {
    fixture.componentRef.setInput('lodgementDateDisabled', true);
    fixture.detectChanges();

    expect(component.form.controls.lodgementDate.disabled).toBe(true);
  });

  it('emits the lodgement date when adding a code in disabled mode', () => {
    fixture.componentRef.setInput('lodgementDateDisabled', true);
    fixture.detectChanges();

    component.form.controls.lodgementDate.setValue('2026-04-13');

    const emitSpy = jest.spyOn(component.selectCodeAndLodgementDate, 'emit');

    component.onAddCode({
      code: 'ABC123',
      title: 'Example title',
    } as CodeRow);

    expect(emitSpy).toHaveBeenCalledWith({
      code: 'ABC123',
      date: '2026-04-13',
    });
  });
});
