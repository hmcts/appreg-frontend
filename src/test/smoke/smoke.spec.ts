import { TestBed } from '@angular/core/testing';
import { AppComponent } from '../../app/app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('App Smoke Test', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      declarations: [AppComponent],
    }).compileComponents();
  });

  it('should compile and instantiate AppComponent', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
