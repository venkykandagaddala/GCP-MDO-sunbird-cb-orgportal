import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ExploreContentService } from '../../../services/explore-content.service'
import { LoaderService } from '../../../../../../../../../../src/app/services/loader.service'

@Component({
  selector: 'ws-app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit {

  contentId: string | null = null
  contentData: any
  contentLoaded = false

  constructor(
    readonly route: ActivatedRoute,
    readonly exploreContentService: ExploreContentService,
    readonly loaderService: LoaderService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loaderService.changeLoaderState(true)
    this.contentId = this.route.snapshot.paramMap.get('identifier')
    if (this.contentId) {
      this.exploreContentService.extendedContentRead(this.contentId).subscribe({
        next: (data: any) => {
          this.contentData = data.result.content
          this.contentLoaded = true
          this.loaderService.changeLoaderState(false)
        },
        error: _err => {
          this.loaderService.changeLoaderState(false)
        }
      })
    } else {
      this.loaderService.changeLoaderState(false)
    }
  }

  goBack(): void {
    this.router.navigate([
      'app',
      'home',
      'explore-content'
    ])
  }

}
