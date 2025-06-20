import { AfterViewInit, Component, OnInit, SimpleChanges, ViewChild } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import * as _ from 'lodash'
import { CustomFieldsService } from '../../../../users/services/custom-fields.service'
import { ActivatedRoute } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component'
@Component({
  selector: 'ws-app-forms-list',
  templateUrl: './forms-list.component.html',
  styleUrls: ['./forms-list.component.scss']
})

export class FormsListComponent implements OnInit, AfterViewInit {

  searchControl = new FormControl()
  tableData: any = []
  data: any = []
  pageSizeOptions = [10, 30, 40]
  columnsList: any = []
  dataSource!: any
  displayedColumns: any = []
  showCreateForm: boolean = false
  length!: number
  pageSize = 10
  pageNumber = 0
  rootOrgId: any
  searchResults: any[] = []
  isLoading = false
  selectedOptions: any[] = []
  selectedOptionsMap: { [key: string]: any[] } = {}
  dynamicDropdownMap: { [rowKey: string]: any } = {}
  dropdownRelations: { [rowKey: string]: any } = {}
  dropdownLevels: { [rowKey: string]: string[] } = {}
  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort
  customFieldObject: any = ''
  enabled: boolean = false

  constructor(private customFieldsService: CustomFieldsService,
    private activeRoute: ActivatedRoute, private matSnackBar: MatSnackBar, private matDialog: MatDialog
  ) {
    this.rootOrgId = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
    this.dataSource = new MatTableDataSource<any>()
    this.dataSource.paginator = this.paginator
  }

  ngOnInit() {
    this.tableData = {
      columns: [
        { displayName: 'Field Name', key: 'fieldName' },
        { displayName: 'Field Attribute', key: 'fieldAttribute' },
        { displayName: 'Created on', key: 'createdOn' },
        { displayName: 'Mandatory', key: 'isMandatory' },
        { displayName: 'Enabled', key: 'isEnabled' },
        { displayName: 'Actions', key: 'actions' },
        { displayName: 'Preview', key: 'preview' },

      ],
      // actions: [],
      needCheckBox: false,
      needHash: false,
      needUserMenus: false,
      sortColumn: '',
      sortState: 'asc',
    }
    this.loadData()
    this.getOrgDetails()
  }

  getOrgDetails() {
    const request = {
      request: { organisationId: this.rootOrgId },
    }
    this.customFieldsService.readOrgData(request).subscribe((res: any) => {
      if (_.get(res, 'result.response.customfieldsdata.isPopupEnabled', false)) {
        this.enabled = true
      } else {
        this.enabled = false
      }
    }, error => {
      console.error('Error fetching organization details', error)
    })
  }

  loadData() {
    this.isLoading = true
    let payload = {
      filterCriteriaMap: {
        organisationId: this.rootOrgId,
      },
      requestedFields: [],
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      orderDirection: "DESC",
      orderBy: 'createdOn',
      facets: []
    }
    this.data = []
    this.customFieldsService.getCustomFields(payload).subscribe((res: any) => {
      this.searchResults = _.get(res, 'result.searchResults.data')
      this.length = _.get(res, 'result.searchResults.totalCount')
      if (this.searchResults.length) {
        this.searchResults.forEach((element: any) => {
          this.data.push({
            fieldName: element.name,
            fieldAttribute: element.attributeName,
            createdOn: element.createdOn,
            isMandatory: element.isMandatory,
            object: element,
            customFieldId: element.customFieldId,
            customFieldData: element.customFieldData,
            isEnabled: element.isEnabled,
            validation: element.validation,
            type: element.type,
            // hiracchy: element.type === 'master' ? this.discoverLevels(element.customFieldData, 0, levelMap) : '',
          })
        })
      }
      this.dataSource.data = this.data
      this.dataSource.data = this.data.map((item: any, idx: any) => ({ ...item, rowIndex: idx }))
      this.initializeDropdowns()
      this.isLoading = false
    }, (err: any) => {
      console.error(err)
      this.isLoading = false
    })
    if (this.tableData) {
      this.displayedColumns = this.tableData.columns
    }
  }
  ngOnChanges(data: SimpleChanges) {
    console.log('data', data)
    this.dataSource.data = _.get(data, 'data.currentValue')
    this.length = this.dataSource.data.length
    if (this.paginator) {
      this.paginator.firstPage()
    }
  }

  ngAfterViewInit() {
    if (this.data) {
      this.dataSource.data = this.data
      this.length = this.dataSource.data.length
      this.dataSource.paginator = this.paginator
      this.dataSource.sort = this.sort
    }
  }

  onToggleChange(event: any, element: any) {
    let payload = {
      customFieldId: element.customFieldId,
      isEnabled: event.checked,
    }
    this.customFieldsService.updateCustomFieldStatus(payload).subscribe((res: any) => {
      if (res.result && res.responseCode === 'OK') {
        this.loadData()
        this.matSnackBar.open(`Field status ${event.checked ? 'activated' : 'deactivated'} successfully!`)
      } else {
        console.log('Error while updating custom field status')
      }
    })
  }

  getFinalColumns() {
    if (this.tableData !== undefined) {
      const columns = _.map(this.tableData.columns, c => c.key)
      if (this.tableData.needCheckBox) {
        columns.splice(0, 0, 'select')
      }
      if (this.tableData.needHash) {
        columns.splice(0, 0, 'SR')
      }
      if (this.tableData.actions && this.tableData.actions.length > 0) {
        columns.push('Actions')
      }
      if (this.tableData.needUserMenus) {
        columns.push('Menu')
      }
      return columns
    }
    return ''
  }

  redirectToNewForm() {
    this.showCreateForm = true
    this.customFieldObject = ''
  }
  closeForm(event: any) {
    if (event) {
      this.customFieldObject = ''
      this.loadData()
      this.showCreateForm = false
    } else {
      this.showCreateForm = false
    }

  }

  deleteHandler(rowData: any) {
    console.log(rowData)
    const dialog = this.matDialog.open(ConfirmDeleteComponent, {
      width: '400px',
      backdropClass: 'backdropBackground',
    })
    dialog.afterClosed().subscribe(res => {
      if (res === true)
        this.customFieldsService.deleteCustomField(rowData.customFieldId).subscribe((res: any) => {
          if (res.result && res.result.status === 'deleted') {
            this.matSnackBar.open('Field is deleted successfully!')
            setTimeout(() => {
              this.loadData()
            }, 500)
          } else {
            console.log('Error while deleting custom field')
          }
        }, error => {
          this.matSnackBar.open(error)
          console.log(error)
        })
    })
  }

  editHandler(rowData: any) {
    console.log(rowData)
    this.showCreateForm = false
    setTimeout(() => {
      this.showCreateForm = true
      this.customFieldObject = ''
      this.customFieldObject = rowData
    }, 500)
  }

  onPageChange(event: any) {
    this.pageNumber = event.pageIndex
    this.pageSize = event.pageSize
    this.pageNumber = event.pageIndex
    this.loadData()
  }

  getSelectedOptions(rowKey: string): any[] {
    if (!this.selectedOptionsMap[rowKey]) {
      this.selectedOptionsMap[rowKey] = []
    }
    return this.selectedOptionsMap[rowKey]
  }

  getSelectedOptionsRef(rowKey: string): any[] {
    if (!this.selectedOptionsMap[rowKey]) {
      this.selectedOptionsMap[rowKey] = []
    }
    return this.selectedOptionsMap[rowKey]
  }

  /**
   * Handle dropdown selection changes with both bottom-up and top-down cascade
   * @param level Level of dropdown that changed
   * @param rowKey Row identifier
   * @param value Selected value
   */
  onDropdownChange(level: number, rowKey: string, value: any = null) {
    const selections = this.getSelectedOptions(rowKey)
    const fieldTypes = this.dropdownLevels[rowKey] || []

    // Update the current selection
    selections[level] = value

    if (value === null) {
      // If clearing a selection, clear child selections to avoid invalid state
      for (let i = level + 1; i < fieldTypes.length; i++) {
        selections[i] = null
      }
    } else {
      // When a value is selected, populate parent dropdowns (bottom-up)
      this.populateParentFields(rowKey, level, value, selections)

      // Also populate child dropdowns (top-down)
      this.populateChildFields(rowKey, level, value, selections)
    }

    // Update the selections
    this.selectedOptionsMap[rowKey] = selections
  }

  /**
   * Enhanced method to populate parent fields based on a selected child value (bottom-up)
   * @param rowKey Row identifier
   * @param level Current level
   * @param value Selected value
   * @param selections Current selections array
   */
  populateParentFields(rowKey: string, level: number, value: any, selections: any[]) {
    const fieldTypes = this.dropdownLevels[rowKey] || []
    const currentFieldType = fieldTypes[level]

    if (!currentFieldType || !this.dropdownRelations[rowKey]?.childToParent[currentFieldType]) {
      return
    }

    // Get parent relationships for this value
    const parentRelations = this.dropdownRelations[rowKey].childToParent[currentFieldType][value] || {}

    // Update parent selections
    Object.keys(parentRelations).forEach(parentType => {
      const parentValue = parentRelations[parentType]
      const parentIndex = fieldTypes.findIndex(type => type === parentType)

      if (parentIndex !== -1) {
        // Set the parent value regardless of level order
        // This ensures bottom-up works correctly
        selections[parentIndex] = parentValue

        // Recursively populate grandparents
        this.populateParentFields(rowKey, parentIndex, parentValue, selections)
      }
    })
  }

  /**
   * New method to populate child fields based on a selected parent value (top-down)
   * @param rowKey Row identifier
   * @param level Current level
   * @param value Selected value
   * @param selections Current selections array
   */
  populateChildFields(rowKey: string, level: number, value: any, selections: any[]) {
    const fieldTypes = this.dropdownLevels[rowKey] || []
    const currentFieldType = fieldTypes[level]

    if (!currentFieldType ||
      !this.dropdownRelations[rowKey]?.parentToChildren[currentFieldType] ||
      !this.dropdownRelations[rowKey]?.parentToChildren[currentFieldType][value]) {
      return
    }

    // Get child relationships for this value
    const childRelations = this.dropdownRelations[rowKey].parentToChildren[currentFieldType][value]

    // For each child field type that could be populated
    Object.keys(childRelations).forEach(childType => {
      const childIndex = fieldTypes.findIndex(type => type === childType)

      // Skip if we can't find this child type in our levels array
      if (childIndex === -1) return

      // If this child level already has a valid selection that's consistent with the parent,
      // then we don't need to change it - this preserves user selections where possible
      const currentChildValue = selections[childIndex]
      if (currentChildValue &&
        childRelations[childType].includes(currentChildValue)) {
        return
      }

      // Otherwise, select the first available child option
      const childOptions = childRelations[childType]
      if (childOptions && childOptions.length > 0) {
        selections[childIndex] = childOptions[0]

        // Recursively populate grandchildren
        this.populateChildFields(rowKey, childIndex, childOptions[0], selections)
      }
    })
  }

  /**
   * Gets filtered options for a dropdown based on parent selections
   * @param rowKey Row identifier
   * @param level Dropdown level
   */
  getFilteredOptions(rowKey: string, level: number): string[] {
    const fieldTypes = this.dropdownLevels[rowKey] || []
    if (level < 0 || level >= fieldTypes.length) {
      return []
    }

    const fieldType = fieldTypes[level]
    const selections = this.getSelectedOptions(rowKey)

    if (!fieldType || !this.dynamicDropdownMap[rowKey]?.[fieldType]) {
      return []
    }

    // By default, return all options
    let options = this.dynamicDropdownMap[rowKey][fieldType]

    // Check if there are parent selections that should filter these options
    for (let i = 0; i < level; i++) {
      const parentType = fieldTypes[i]
      const parentValue = selections[i]

      if (parentValue &&
        this.dropdownRelations[rowKey]?.parentToChildren[parentType]?.[parentValue]?.[fieldType]) {
        // Filter to only children of the selected parent
        options = this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue][fieldType]
        break // Most immediate parent takes precedence
      }
    }

    return options
  }

  // Pre-select values for a specific row
  preSelectDropdownValues(rowKey: string, selections: any[]) {
    // Create the row's options array if it doesn't exist
    if (!this.selectedOptionsMap[rowKey]) {
      this.selectedOptionsMap[rowKey] = []
    }

    // Set initial selections
    selections.forEach((selection, index) => {
      this.selectedOptionsMap[rowKey][index] = selection
    })
  }

  // Call this when loading data
  initializeDropdowns() {
    // Clear any existing selections
    this.selectedOptionsMap = {}
    this.dynamicDropdownMap = {}
    this.dropdownRelations = {}
    this.dropdownLevels = {}

    // Check if dataSource and its data exist
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) {
      return
    }

    // Loop through each row in the data source
    this.dataSource.data.forEach((row: any, index: number) => {
      const rowKey = index.toString()

      // Skip rows that don't have customFieldData or aren't masterList type
      if (!row.customFieldData || !Array.isArray(row.customFieldData) || row.customFieldData.length === 0 || row.type !== 'masterList') {
        return
      }

      // Initialize an empty array for this row
      this.selectedOptionsMap[rowKey] = []

      // Process the data for this row
      this.processHierarchicalData(row.customFieldData, rowKey)

      // Initialize selections for all levels with null
      const levels = this.dropdownLevels[rowKey] || []
      levels.forEach((_, index) => {
        this.selectedOptionsMap[rowKey][index] = null
      })
    })
  }

  /**
   * Process hierarchical data to build dropdown structures
   * @param data Hierarchical data to process
   * @param rowKey Row identifier
   */
  processHierarchicalData(data: any[], rowKey: string) {
    if (!data || !Array.isArray(data) || data.length === 0) return

    // Map to store field types and their options
    this.dynamicDropdownMap[rowKey] = {}

    // Map to store relationships between fields
    this.dropdownRelations[rowKey] = {
      childToParent: {}, // Maps a child value to its parent value
      parentToChildren: {} // Maps a parent value to its children values
    }

    // Set to track field types in order of hierarchy
    const fieldTypes: Set<string> = new Set()

    // Function to traverse the hierarchy
    const traverseHierarchy = (
      items: any[],
      parentType: string | null = null,
      parentValue: string | null = null,
      path: string[] = []
    ) => {
      if (!items || items.length === 0) return

      items.forEach(item => {
        const fieldType = item.fieldAttribute
        const fieldValue = item.fieldValue

        // Add to field types if new
        if (!fieldType) return
        fieldTypes.add(fieldType)

        // Initialize collection for this field type if needed
        if (!this.dynamicDropdownMap[rowKey][fieldType]) {
          this.dynamicDropdownMap[rowKey][fieldType] = new Set()
        }

        // Add value to the collection
        this.dynamicDropdownMap[rowKey][fieldType].add(fieldValue)

        // Store parent-child relationship if applicable
        if (parentType && parentValue) {
          // Child to parent mapping
          if (!this.dropdownRelations[rowKey].childToParent[fieldType]) {
            this.dropdownRelations[rowKey].childToParent[fieldType] = {}
          }
          if (!this.dropdownRelations[rowKey].childToParent[fieldType][fieldValue]) {
            this.dropdownRelations[rowKey].childToParent[fieldType][fieldValue] = {}
          }
          this.dropdownRelations[rowKey].childToParent[fieldType][fieldValue][parentType] = parentValue

          // Parent to children mapping
          if (!this.dropdownRelations[rowKey].parentToChildren[parentType]) {
            this.dropdownRelations[rowKey].parentToChildren[parentType] = {}
          }
          if (!this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue]) {
            this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue] = {}
          }
          if (!this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue][fieldType]) {
            this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue][fieldType] = new Set()
          }
          this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue][fieldType].add(fieldValue)
        }

        // Continue traversing if there are child values
        if (item.fieldValues && Array.isArray(item.fieldValues) && item.fieldValues.length > 0) {
          traverseHierarchy(
            item.fieldValues,
            fieldType,
            fieldValue,
            [...path, fieldType]
          )
        }
      })
    }

    // Start traversal
    traverseHierarchy(data)

    // Store field types in order
    this.dropdownLevels[rowKey] = Array.from(fieldTypes)

    // Convert Sets to Arrays
    Object.keys(this.dynamicDropdownMap[rowKey]).forEach(fieldType => {
      this.dynamicDropdownMap[rowKey][fieldType] =
        Array.from(this.dynamicDropdownMap[rowKey][fieldType])
    })

    Object.keys(this.dropdownRelations[rowKey].parentToChildren).forEach(parentType => {
      Object.keys(this.dropdownRelations[rowKey].parentToChildren[parentType]).forEach(parentValue => {
        Object.keys(this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue]).forEach(childType => {
          this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue][childType] =
            Array.from(this.dropdownRelations[rowKey].parentToChildren[parentType][parentValue][childType])
        })
      })
    })
  }

  /**
   * Gets all available options for a dropdown (no filtering)
   * @param rowKey Row identifier
   * @param level Dropdown level
   * @returns Array of all available options for the dropdown
   */
  getAllOptions(rowKey: string, level: number): string[] {
    const fieldTypes = this.dropdownLevels[rowKey] || []
    if (level < 0 || level >= fieldTypes.length) {
      return []
    }

    const fieldType = fieldTypes[level]
    if (!fieldType || !this.dynamicDropdownMap[rowKey]?.[fieldType]) {
      return []
    }

    // Return all options for this field type without filtering
    return this.dynamicDropdownMap[rowKey][fieldType]
  }

  onToggle(event: any) {
    this.enabled = event.checked
    const payoad: any = {
      isPopupEnabled: this.enabled,
      organisationId: this.rootOrgId
    }
    this.customFieldsService.updatePopup(payoad).subscribe((res: any) => {
      if (res.result && res.responseCode === 'OK') {
        this.matSnackBar.open(`Popup is ${event.checked ? 'enabled' : 'disabled'} successfully!`)
      } else {
        this.matSnackBar.open('Error while updating popup status')
      }
    }, (error: any) => {
      console.log('error', error)
      this.matSnackBar.open(_.get(error, 'error.params.err', 'Error while updating popup status'))
    })

  }
}
