import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyPackPage } from './buy-pack-page';

describe('BuyPackPage', () => {
  let component: BuyPackPage;
  let fixture: ComponentFixture<BuyPackPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuyPackPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyPackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
