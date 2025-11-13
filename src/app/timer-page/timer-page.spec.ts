import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerPage } from './timer-page';

describe('TimerPage', () => {
  let component: TimerPage;
  let fixture: ComponentFixture<TimerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
