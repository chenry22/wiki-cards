import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BinderCreate } from './binder-create';

describe('BinderCreate', () => {
  let component: BinderCreate;
  let fixture: ComponentFixture<BinderCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BinderCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BinderCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
