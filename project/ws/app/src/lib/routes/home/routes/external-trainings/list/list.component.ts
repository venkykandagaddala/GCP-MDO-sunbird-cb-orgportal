import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core'
import { DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { ExternalTrainingsService } from '../../../services/external-trainings.service'
import { LoaderService } from '../../../../../../../../../../src/app/services/loader.service'
import { MatTableDataSource } from '@angular/material/table'
import { MatSort } from '@angular/material/sort'
import { MatPaginator } from '@angular/material/paginator'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-external-trainings-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [DatePipe],
})
export class ListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort!: MatSort
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator

  // Data Properties
  externalTrainingsData: any = []
  fetchContentDone = false
  totalCount = 0
  dataSource = new MatTableDataSource<any>([])

  // Pagination
  pageIndex = 0
  limit = 20
  searchQuery = ''

  // Table columns
  displayedColumns: string[] = ['name', 'deliveryMode', 'duration', 'createdOn', 'actions']

  // Config
  configSvc: any
  currentRowActions: any[] = []

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private externalTrainingsSvc: ExternalTrainingsService,
    private loaderService: LoaderService,
    private datePipe: DatePipe,
  ) { }

  ngOnInit() {
    this.configSvc = this.activeRoute.snapshot.data['configService']
    this.getExternalTrainings()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort
  }

  // Search
  searchTrainings(searchString: string) {
    this.pageIndex = 0
    this.searchQuery = searchString.trim()
    this.getExternalTrainings()
  }

  onSearch() {
    this.pageIndex = 0
    this.getExternalTrainings()
  }

  // API call
  getExternalTrainings() {
    this.loaderService.changeLoaderState(true)
    this.fetchContentDone = false

    const payload: any = {
      locale: ['en'],
      request: {
        query: this.searchQuery,
        limit: this.limit,
        offset: this.pageIndex * this.limit,
        filters: {
          status: ['Live'],
          contentType: 'Event',
          category: 'externalTraining',
          createdFor: _.get(this.configSvc, 'userProfile.rootOrgId'),
        },
        sort_by: {
          lastUpdatedOn: 'desc',
        },
      },
    }

    this.externalTrainingsSvc.getApprovalsList(payload).pipe(
      map((response: any) => {
        const items: any[] = _.get(response, 'result.Event', [])
        const count: number = _.get(response, 'result.count', items.length)
        const transformed = items.map((item: any) => {
          const durationSec = item.duration || 0
          const hours = Math.floor(durationSec / 3600)
          return {
            ...item,
            createdOnFormatted: item.createdOn
              ? this.datePipe.transform(item.createdOn, 'MMM dd, yyyy') || ''
              : '',
            createdOnSort: item.createdOn ? new Date(item.createdOn).getTime() : 0,
            durationFormatted: durationSec ? `${hours} ${hours === 1 ? 'Hour' : 'Hours'}` : '',
          }
        })
        return { data: transformed, count }
      })
    ).subscribe({
      next: ({ data, count }) => {
        this.totalCount = count
        this.externalTrainingsData = data
        this.convertDataForTable()
      },
      error: () => {
        this.loaderService.changeLoaderState(false)
        this.fetchContentDone = true
      },
    })
  }

  // Data processing
  convertDataForTable() {
    this.dataSource = new MatTableDataSource(this.externalTrainingsData)
    this.setupTableSorting()
    this.fetchContentDone = true
    this.loaderService.changeLoaderState(false)
  }

  private setupTableSorting() {
    setTimeout(() => {
      this.dataSource.sort = this.sort
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'createdOn': return item.createdOnSort
          case 'name': return _.get(item, 'name', '').toLowerCase()
          // case 'sourceName': return _.get(item, 'sourceName', '').toLowerCase()
          case 'eventType': return _.get(item, 'eventType', '').toLowerCase()
          case 'durationFormatted': return item.duration || 0
          default: return item[property] || ''
        }
      }
    }, 0)
  }

  // Actions
  prepareActions() {
    this.currentRowActions = [
      { key: 'viewDetails', name: 'View Details', icon: 'visibility' },
      { key: 'createBatch', name: 'Create Batch', icon: 'add' },
    ]

  }

  menuSelected(row: any, actionKey: string) {
    if (row?.identifier) {
      switch (actionKey) {
        case 'viewDetails':
          this.router.navigate(['app', 'home', 'external-trainings', row.identifier, 'details'])
          break
        case 'createBatch':
          this.router.navigate(['app', 'home', 'external-trainings', row.identifier, 'batches'])
          break
        default:
          break
      }
    }
  }

  updateStatus(row: any, status: string) {
    this.loaderService.changeLoaderState(true)
    const payload = {
      request: {
        id: row.id,
        status,
      },
    }

    this.externalTrainingsSvc.updateApprovalStatus(payload).subscribe({
      next: () => {
        this.loaderService.changeLoaderState(false)
        this.getExternalTrainings()
      },
      error: () => {
        this.loaderService.changeLoaderState(false)
      },
    })
  }

  // Pagination
  onPaginateChange(pageData: any) {
    this.pageIndex = pageData?.pageIndex || 0
    this.limit = pageData?.pageSize || 20
    this.getExternalTrainings()
  }

  onSortChange(event: any) {
    console.log('Sort changed:', event)
  }

  trackByActionKey(_index: number, action: any): any {
    return action.key
  }

  createNewTraining() {
    this.router.navigate(['app', 'home', 'external-trainings', 'new'])
  }
}
