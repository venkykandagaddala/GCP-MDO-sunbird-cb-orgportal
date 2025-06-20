import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'

const API_ENDPOINTS = {
  CREATE: `/apis/proxies/v8/customFields/v1/create`,
  CREATE_LIST: `/apis/proxies/v8/customFields/v1/masterList/create`,
  UPDATE_LIST: `/apis/proxies/v8/customFields/v1/masterList/update`,
  LIST_CUSTOM_FIELDS: `/apis/proxies/v8/customFields/v1/search`,
  DELETE: `/apis/proxies/v8/customFields/v1/delete`,
  READ: `/apis/proxies/v8/customFields/v1/read`,
  UPDATE: `/apis/proxies/v8/customFields/v1/update`,
  UPDATE_STATUS: `/apis/proxies/v8/customFields/v1/status/update`,
  ENABLE_DISABLE_POPUP: `/apis/proxies/v8/customFields/v1/popup/update`,
  READ_ORG_DETAILS: `api/org/v1/read`
}

@Injectable()
export class CustomFieldsService {
  constructor(private http: HttpClient) { }

  createField(filter: object): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.CREATE}`, filter)
  }

  createList(filter: object): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.CREATE_LIST}`, filter)
  }

  getCustomFields(payload: object): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.LIST_CUSTOM_FIELDS}`, payload)
  }

  deleteCustomField(id: string): Observable<any> {
    return this.http.delete<any>(`${API_ENDPOINTS.DELETE}/${id}`)
  }

  readCustomField(id: string): Observable<any> {
    return this.http.get<any>(`${API_ENDPOINTS.READ}/${id}`)
  }

  updateCustomField(id: string, payload: object): Observable<any> {
    return this.http.put<any>(`${API_ENDPOINTS.UPDATE}/${id}`, payload)
  }

  updateCustomFieldStatus(payload: any): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.UPDATE_STATUS}`, payload)
  }

  updateList(filter: object): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.UPDATE_LIST}`, filter)
  }

  updatePopup(request: object): Observable<any> {
    return this.http.post<any>(`${API_ENDPOINTS.ENABLE_DISABLE_POPUP}`, request)
  }

  readOrgData(request: any) {
    return this.http.post<any>(API_ENDPOINTS.READ_ORG_DETAILS, request)
  }

}
