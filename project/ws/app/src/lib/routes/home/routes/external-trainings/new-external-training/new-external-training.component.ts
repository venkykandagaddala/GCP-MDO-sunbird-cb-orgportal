import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { ExternalTrainingsService } from '../../../services/external-trainings.service'
import { deliveryModeList as deliveryModes } from '../models/external-trainings.model'
import { mergeMap } from 'rxjs/operators'
import * as _ from 'lodash'
import { MatLegacySnackBar } from '@angular/material/legacy-snack-bar'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'

@Component({
  selector: 'ws-app-new-external-training',
  templateUrl: './new-external-training.component.html',
  styleUrls: ['./new-external-training.component.scss']
})
export class NewExternalTrainingComponent implements OnInit {
  trainingForm!: FormGroup
  selectedCompetencyList: any[] = []
  deliveryModeList = deliveryModes
  configSvc: any

  // Logo state variables
  defaultCertificateTemplateUrl = 'assets/images/sample/CourseCertificate_Template.svg'
  mergedLogoUrl: string | null = null
  previewLogoUrl = ''
  logoFileName = ''
  logoUploaded = false
  isLogoMerging = false

  //
  contentFile: any
  fileName = ''
  certificateUrl = ''
  safeCertificateUrl: SafeResourceUrl | null = null
  selectedLogoImage: string | ArrayBuffer | null = null
  private readonly TARGET_HEIGHT = 73;
  private readonly TARGET_Y_CENTER = 104;
  private readonly TARGET_X_START = 1050;

  private readonly FILE_UPLOAD_MAX_SIZE = 1 * 1024 * 1024 * 1024 // 1GB

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private activeRoute: ActivatedRoute,
    private externalTrainingsSvc: ExternalTrainingsService,
    private matSnackBar: MatLegacySnackBar,
    public sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.configSvc = this.activeRoute.snapshot.data['configService']
    this.previewLogoUrl = this.defaultCertificateTemplateUrl
    this.initializeForm()
    this.getDefaultTemplate()
  }

  getDefaultTemplate() {
    if (!this.defaultCertificateTemplateUrl) {
      this.openSnackbar('Default certificate template not found.')
      return
    }

    fetch(this.defaultCertificateTemplateUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'CourseCertificate_Template.svg', { type: 'image/svg+xml' })
        this.contentFile = file
        this.fileName = file.name

        this.certificateUrl = URL.createObjectURL(file)
        this.safeCertificateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.certificateUrl)
      })
      .catch(() => {
        this.openSnackbar('Failed to load default certificate template.')
      })
  }

  initializeForm(): void {
    this.trainingForm = this.fb.group({
      trainingTitle: ['', Validators.required],
      learningObjective: [''],
      deliveryMode: [''],
      learningHours: [''],
      trainingType: ['', Validators.required],
      partnerName: ['']
    })
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement
    if (input?.files?.[0]) {
      this.handleLogoUpload(input.files[0])
    }
  }

  private isValidFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml'
  }

  private handleLogoUpload(file: File): void {
    if (!this.isValidFile(file)) {
      this.openSnackbar('Please upload a valid SVG file.')
      return
    }

    if (file.size > this.FILE_UPLOAD_MAX_SIZE) {
      this.openSnackbar('Please upload a file less than 1 GB.')
      return
    }

    // this.logoFileName = file.name
    // this.isLogoMerging = true

    // const formData = new FormData()
    // formData.append('defaultCertificateTemplateUrl', this.defaultCertificateTemplateUrl)
    // formData.append('logoFile', file)

    // this.externalTrainingsSvc.mergeLogo(formData).subscribe({
    //   next: (response: any) => {
    //     this.mergedLogoUrl = response?.mergedLogoUrl || null
    //     this.previewLogoUrl = this.mergedLogoUrl || this.defaultCertificateTemplateUrl
    //     this.logoUploaded = true
    //     this.isLogoMerging = false
    //     this.openSnackbar('Logo merged successfully.')
    //   },
    //   error: () => {
    //     this.isLogoMerging = false
    //     this.openSnackbar('Failed to merge logo. Please try again.')
    //   },
    // })

    const fileName = file.name
    // const uploadedDate = new Date().toLocaleDateString()

    // Read file as data URL for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result

      this.logoFileName = fileName
      this.logoUploaded = true
      this.selectedLogoImage = imageData || null
      this.mergeLogo()
    }
    reader.readAsDataURL(file)
  }

  private mergeLogo(): void {
    try {
      const certificateReader = new FileReader()
      certificateReader.onload = (certEvent) => {
        const certificateSvgContent = certEvent.target?.result as string

        // If selectedLogoImage is a data URL, we need to convert it
        if (typeof this.selectedLogoImage === 'string' && this.selectedLogoImage.startsWith('data:')) {
          // Extract the base64 content and decode it
          const base64Content = this.selectedLogoImage.split(',')[1]
          const binaryString = atob(base64Content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const logoBlob = new Blob([bytes])
          const logoReader = new FileReader()
          logoReader.onload = (logoEvent) => {
            this.processMergeLogo(certificateSvgContent, logoEvent.target?.result as string)
          }
          logoReader.readAsText(logoBlob)
        }
      }
      certificateReader.readAsText(this.contentFile)
    } catch (error: any) {
      this.openSnackbar(`Error processing files: ${error.message}`, 'close')
    }
  }

  // Process the actual logo merge operation
  private processMergeLogo(certificateSvgContent: string, logoSvgContent: string): void {
    try {
      // Update certificate with logo
      const updatedCertificateSvg = this.updateCertificateWithLogo(
        certificateSvgContent,
        logoSvgContent
      )

      // Create a new blob with the updated SVG content
      const updatedBlob = new Blob([updatedCertificateSvg], { type: 'image/svg+xml' })
      this.contentFile = new File(
        [updatedBlob],
        this.fileName || 'certificate.svg',
        { type: 'image/svg+xml' }
      )

      // Update certificate preview URL
      this.certificateUrl = URL.createObjectURL(updatedBlob)
      this.safeCertificateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.certificateUrl)

    } catch (error: any) { }
  }

  // Extracts the logo and places it at the ProvidersLogo_Placement location in the certificate
  private updateCertificateWithLogo(certificateSvgContent: string, logoSvgContent: string): string {
    const parser = new DOMParser()
    const certDoc = parser.parseFromString(certificateSvgContent, 'image/svg+xml')

    // Check for parsing errors in certificate
    if (certDoc.querySelector('parsererror')) {
      this.openSnackbar('Error parsing certificate SVG', 'close')
      return ''
    }

    // Find the ProvidersLogo_Placement group
    // let logoGroup = certDoc.getElementById('ProvidersLogo_Placement')
    // if (!logoGroup) {
    //   logoGroup = certDoc.querySelector('[id="ProvidersLogo_Placement"]')
    // }
    // if (!logoGroup) {
    //   // Try partial match if id not exact
    //   logoGroup = certDoc.querySelector('g[id*="ProvidersLogo_Placement"]')
    // }

    // if (!logoGroup) {
    //   this.openSnackbar('Could not find ProvidersLogo_Placement group in the certificate SVG', 'close')
    //   return ''
    // }

    // Parse the new logo SVG
    const logoDoc = parser.parseFromString(logoSvgContent, 'image/svg+xml')
    if (logoDoc.querySelector('parsererror')) {
      this.openSnackbar('Error parsing logo SVG', 'close')
      return ''
    }

    const logoSvg = logoDoc.querySelector('svg')
    if (!logoSvg) {
      this.openSnackbar('Invalid logo SVG structure: No <svg> tag found', 'close')
      return ''
    }

    // Create a new group for the logo
    const newLogoGroup = certDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
    newLogoGroup.setAttribute('id', 'ProvidersLogo_Placement')

    // --- Dimension Extraction & Alignment Logic ---
    const viewBox = logoSvg.getAttribute('viewBox')
    let minX = 0, minY = 0, logoWidth = 100, logoHeight = 100

    if (viewBox) {
      const vbParts = viewBox.split(/[\s,]+/).map(parseFloat)
      if (vbParts.length >= 4) {
        minX = vbParts[0]
        minY = vbParts[1]
        logoWidth = vbParts[2]
        logoHeight = vbParts[3]
      }
    } else {
      // Fallback to width/height attributes if viewBox is missing
      const wAttr = logoSvg.getAttribute('width')
      const hAttr = logoSvg.getAttribute('height')

      // Attempt to parse pixel values, ignoring 'px'
      logoWidth = wAttr ? parseFloat(wAttr) : 100
      logoHeight = hAttr ? parseFloat(hAttr) : 100
    }

    // 1. Calculate Scale to match target height
    if (logoHeight === 0) logoHeight = 100
    const scale = this.TARGET_HEIGHT / logoHeight

    // 2. Calculate Translate X
    // Rendered Left = (minX * scale) + tx => tx = TargetLeft - (minX * scale)
    const tx = this.TARGET_X_START - (minX * scale)

    // 3. Calculate Translate Y
    // Rendered Center Y = ((minY + height/2) * scale) + ty => ty = TargetCenterY - (LocalCenterY * scale)
    const localCenterY = minY + (logoHeight / 2)
    const ty = this.TARGET_Y_CENTER - (localCenterY * scale)

    const newTransform = `translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`
    newLogoGroup.setAttribute('transform', newTransform)

    // We clone nodes to avoid modifying the parsed source logic references directly during iteration
    const logoChildren = Array.from(logoSvg.childNodes)

    for (const child of logoChildren) {
      if (child.nodeType === 1) {
        const importedNode = certDoc.importNode(child, true) as Element

        if (importedNode.tagName.toLowerCase() === 'svg') {
          if (!importedNode.getAttribute('width')) {
            importedNode.setAttribute('width', logoWidth.toString())
          }
          if (!importedNode.getAttribute('height')) {
            importedNode.setAttribute('height', logoHeight.toString())
          }
          if (!importedNode.getAttribute('viewBox') && viewBox) {
            importedNode.setAttribute('viewBox', viewBox)
          }
        }

        newLogoGroup.appendChild(importedNode)
      }
    }

    // if (logoGroup.parentNode) {
    //   logoGroup.parentNode.replaceChild(newLogoGroup, logoGroup)
    // }

    const serializer = new XMLSerializer()
    return serializer.serializeToString(certDoc)
  }

  removeUploadedLogo(): void {
    this.mergedLogoUrl = null
    this.previewLogoUrl = this.defaultCertificateTemplateUrl
    this.logoFileName = ''
    this.logoUploaded = false
  }

  onSelectedCompetencyChange(selectedCompetency: any): void {
    this.selectedCompetencyList = selectedCompetency
  }

  get buildPayload(): any {
    const form = this.trainingForm.value
    const eventType = _.get(form, 'deliveryMode') || ''
    const learningHours = _.get(form, 'learningHours') || 0
    const logoUrl = this.mergedLogoUrl || this.defaultCertificateTemplateUrl

    return {
      request: {
        event: {
          mimeType: 'application/html',
          locale: 'en',
          name: _.get(form, 'trainingTitle'),
          description: _.get(form, 'learningObjective'),
          category: 'externalTraining',
          duration: learningHours * 3600,
          createdBy: _.get(this.configSvc, 'userProfile.userId'),
          categoryType: _.get(form, 'trainingType'),
          sourceName: _.get(this.configSvc, 'unMappedUser.rootOrg.orgName'),
          orgLogo: logoUrl,
          cerTemplate: logoUrl,
          code: 'externalTraining',
          eventType,
          createdFor: [_.get(this.configSvc, 'userProfile.rootOrgId')],
          channel: _.get(this.configSvc, 'userProfile.rootOrgId'),
          competencies_v6: this.selectedCompetencyList,
          trackable: {
            enabled: 'Yes',
            autoBatch: 'No',
          },
          creatorName: _.get(this.configSvc, 'userProfile.firstName'),
          createrEmail: _.get(this.configSvc, 'userProfile.email'),
          partnerName: _.get(form, 'partnerName'),
        },
      },
    }
  }

  onSubmit(): void {
    if (this.trainingForm.valid && this.selectedCompetencyList.length > 0) {
      const formData = this.buildPayload
      this.externalTrainingsSvc.createExternalTraining(formData).pipe(
        mergeMap((createRes: any) => {
          const publishPayload = {
            request: {
              event: {
                identifier: _.get(createRes, 'result.identifier'),
                versionKey: _.get(createRes, 'result.versionKey'),
              },
            },
          }
          return this.externalTrainingsSvc.publishExternalTraining(publishPayload)
        })
      ).subscribe({
        next: (result) => {
          if (_.get(result, 'result.identifier')) {
            this.openSnackbar('Training created and published successfully.')
            this.navigateToCreateBatch(_.get(result, 'result.identifier'))
          }
        },
        error: (err) => {
          const errorMessage = _.get(err, 'error.params.errmsg', 'An error occurred while creating the training.')
          this.openSnackbar(errorMessage)
        },
      })
    }
  }

  navigateToCreateBatch(identifier: string): void {
    this.router.navigate(['app', 'home', 'external-trainings', identifier, 'create-batch'])
  }

  goBackToExternalTrainings(): void {
    this.router.navigate(['/app/home/external-trainings'])
  }

  openSnackbar(message: string, action: string = 'Close'): void {
    this.matSnackBar.open(message, action, {
      duration: 3000,
    })
  }
}
