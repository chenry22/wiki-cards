import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullCard } from './full-card';

describe('FullCard', () => {
  let component: FullCard;
  let fixture: ComponentFixture<FullCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
