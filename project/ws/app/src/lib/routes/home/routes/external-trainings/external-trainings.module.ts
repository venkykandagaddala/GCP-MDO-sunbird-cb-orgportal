import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyFormFieldModule as MatFormFieldModule, MatLegacyFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyButtonModule } from '@angular/material/legacy-button'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacyCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyTabsModule } from '@angular/material/legacy-tabs'
import { MatLegacyTooltipModule } from '@angular/material/legacy-tooltip'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatSortModule } from '@angular/material/sort'
import { BaseComponent } from './base/base.component'
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle'
import { UIORGTableModule } from '@sunbird-cb/collection'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDialogModule } from '@angular/material/dialog'
import { ListComponent } from './list/list.component'
import { ExternalTrainingsRoutingModule } from './external-trainings-routing.module'
import { ExternalTrainingsService } from '../../services/external-trainings.service'
import { DetailsComponent } from './details/details.component'
import { BatchesComponent } from './batches/batches.component'
import { TrainingViewComponent } from './training-view/training-view.component'
import { CreateBatchComponent } from './create-batch/create-batch.component'
import { NewExternalTrainingComponent } from './new-external-training/new-external-training.component'
import { CompetenciesModule } from '@sunbird-cb/consumption'
import { MatLegacySnackBarModule } from '@angular/material/legacy-snack-bar'

@NgModule({
  declarations: [
    BaseComponent,
    ListComponent,
    DetailsComponent,
    BatchesComponent,
    TrainingViewComponent,
    NewExternalTrainingComponent,
    CreateBatchComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExternalTrainingsRoutingModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatLegacyButtonModule,
    MatMenuModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatLegacyCheckboxModule,
    MatLegacyTabsModule,
    MatDialogModule,
    MatLegacyFormFieldModule,
    MatLegacyTooltipModule,
    MatMenuModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatLegacyCheckboxModule,
    MatCardModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatLegacyTabsModule,
    MatSortModule,
    MatSlideToggleModule,
    UIORGTableModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    CompetenciesModule,
    MatLegacySnackBarModule
  ],
  providers: [
    ExternalTrainingsService
  ]
})
export class ExternalTrainingsModule { }
