import { Component } from '@angular/core';
import { ElectronService } from '../../core/services/electron.service';

@Component({
  selector: 'app-titlebar',
  standalone: true,
  templateUrl: './titlebar.component.html',
  styleUrl: './titlebar.component.scss',
})
export class TitlebarComponent {
  constructor(private electron: ElectronService) {}

  get isElectron() { return this.electron.isElectron; }

  minimize() { this.electron.minimizeWindow(); }
  maximize() { this.electron.maximizeWindow(); }
  close()    { this.electron.closeWindow(); }
}
