import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendTradePage } from './send-trade-page';

describe('SendTradePage', () => {
  let component: SendTradePage;
  let fixture: ComponentFixture<SendTradePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendTradePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendTradePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
