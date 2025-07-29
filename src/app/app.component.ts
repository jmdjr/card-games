import { Component } from '@angular/core';
import { AppTemplateBaseComponent, ComponentModule } from 'personal-site-template/src/app/app.component';
import { HeaderService } from 'personal-site-template/src/app/services/header.service';
import { HEADING, PROJECT_NAME } from '../assets/site.data';
import { ProjectDataTrackerService } from 'personal-site-template/src/app/services/ProjectDataTracker.service';
import { PhaserGameFrameComponent } from './components/PhaserGameFrame/PhaserGameFrame.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [AppTemplateBaseComponent]
})
export class AppComponent {
  modules: ComponentModule[] = [
    new ComponentModule(PhaserGameFrameComponent)
  ]

  constructor(private header: HeaderService,
    private project: ProjectDataTrackerService
  ) {
    this.header.heading = HEADING;
    this.project.name = PROJECT_NAME;
  }
}
