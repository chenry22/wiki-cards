import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesPage } from './trades-page';

describe('TradesPage', () => {
  let component: TradesPage;
  let fixture: ComponentFixture<TradesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
