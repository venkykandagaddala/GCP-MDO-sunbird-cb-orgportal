import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ExternalTrainingsService } from '../../../services/external-trainings.service'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  training: any = {}
  isTableExpanded = true
  listView = true

  constructor(
    private route: ActivatedRoute,
    private externalTrainingsSvc: ExternalTrainingsService
  ) { }

  ngOnInit() {
    this.getRoutingDetails()
  }

  getRoutingDetails() {
    const id = this.route.parent?.snapshot.params['id']
    if (id) {
      this.getTrainingDetails(id)
    }
  }

  getTrainingDetails(id: string) {
    this.externalTrainingsSvc.getExternalTrainingDetails(id).subscribe(
      (response: any) => {
        const event = _.get(response, 'result.event', {})
        const durationInSeconds = event.duration || 0
        const hours = durationInSeconds / 3600
        const learningHours = Number.isInteger(hours)
          ? `${hours} Hour${hours !== 1 ? 's' : ''}`
          : `${hours.toFixed(2)} Hours`

        this.training = {
          ...event,
          title: event.name,
          deliveryMode: event.eventType,
          learningHours,
          learningObjective: event.description,
          competency_v6: event.competencies_v6 || [],
        }
      }
    )
  }

  get competenciesValue(): any[] {
    const control = this.training ? this.training.competency_v6 : null
    return (control && control.value) || []
  }

  get uniqueAreas(): string[] {
    if (!this.training?.competency_v6 || !this.training.competency_v6.length) {
      return []
    }

    return Array.from(new Set(
      this.training.competency_v6.map((comp: any) => comp.competencyAreaName),
    ))
  }

  getUniqueThemesForArea(areaName: string): string[] {
    if (!this.training?.competency_v6 || !this.training.competency_v6.length) {
      return []
    }

    const themesForArea = this.training.competency_v6
      .filter((comp: any) => comp.competencyAreaName === areaName)
      .map((comp: any) => comp.competencyThemeName)

    return Array.from(new Set(themesForArea))
  }

  getSubthemesForAreaAndTheme(areaName: string, themeName: string): string[] {
    if (!this.training?.competency_v6 || !this.training.competency_v6.length) {
      return []
    }

    return this.training.competency_v6
      .filter((comp: any) =>
        comp.competencyAreaName === areaName &&
        comp.competencyThemeName === themeName,
      )
      .map((comp: any) => comp.competencySubThemeName)
  }

  getTotalRowsForArea(areaName: string): number {
    let totalRows = 0
    for (const theme of this.getUniqueThemesForArea(areaName)) {
      totalRows += this.getSubthemesForAreaAndTheme(areaName, theme).length
    }
    return totalRows
  }
}
