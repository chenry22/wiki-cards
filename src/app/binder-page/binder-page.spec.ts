import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BinderPage } from './binder-page';

describe('BinderPage', () => {
  let component: BinderPage;
  let fixture: ComponentFixture<BinderPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BinderPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BinderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
