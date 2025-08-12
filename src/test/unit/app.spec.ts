import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { App } from '../../app/app';

@Component({ selector: 'app-header', template: '', standalone: true })
class FakeHeaderComponent {}

@Component({ selector: 'app-footer', template: '', standalone: true })
class FakeFooterComponent {}

@Component({ selector: 'router-outlet', template: '', standalone: true })
class FakeRouterOutlet {}

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        App,
        FakeHeaderComponent,
        FakeFooterComponent,
        FakeRouterOutlet,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Default page template',
    );
  });
});
