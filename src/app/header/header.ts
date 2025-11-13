import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, MatToolbarModule, MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

}

