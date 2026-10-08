import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

describe('AppComponent', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppModule, NoopAnimationsModule],
      providers: [provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('is not logged in without a token', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.isLoggedIn()).toBeFalse();
    expect(app.myCharacters()).toEqual([]);
  });

  it('forgets the user when the login failed', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    window.localStorage.setItem('userId', '7');
    app.setUser({ result: 'fail' } as any);
    expect(window.localStorage.getItem('userId')).toBeNull();
    app.setUser(undefined as any);  // a failed request gives no user at all
    expect(window.localStorage.getItem('userId')).toBeNull();
  });
});
