import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'


const API_END_POINTS = {
  CREATE_EXTERNAL_TRAINING: '/apis/proxies/v8/externaltraining/v4/create',
  PUBLISH_EXTERNAL_TRAINING: (identifier: string) => `/apis/proxies/v8/externaltraining/v4/publish/${identifier}`,
  MERGE_LOGO: '/apis/proxies/v8/externaltraining/v4/merge-logo',
  APPROVALS_LIST: '/apis/proxies/v8/sunbirdigot/search',
  STATUS_UPDATE: '/apis/proxies/v8/learner/achievement/status/update',
  GET_ACHIEVEMENT_DETAILS: (achievementId: string) => `/apis/proxies/v8/learner/achievement/${achievementId}`,
  GET_EXTERNAL_TRAINING_DETAILS: (identifier: string) => `/apis/proxies/v8/externaltraining/v4/read/${identifier}`,
}
@Injectable({
  providedIn: 'root'
})
export class ExternalTrainingsService {

  constructor(private http: HttpClient,) { }

  createExternalTraining(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.CREATE_EXTERNAL_TRAINING, request)
  }

  publishExternalTraining(formData: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.PUBLISH_EXTERNAL_TRAINING(formData.request.event.identifier), formData)
  }

  mergeLogo(formData: FormData): Observable<any> {
    return this.http.post<any>(API_END_POINTS.MERGE_LOGO, formData)
  }

  getApprovalsList(request: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.APPROVALS_LIST, request)
  }

  updateApprovalStatus(request: any): Observable<any> {
    return this.http.put<any>(API_END_POINTS.STATUS_UPDATE, request)
  }

  getAchievementDetails(achievementId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_ACHIEVEMENT_DETAILS(achievementId))
  }

  getExternalTrainingDetails(identifier: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_EXTERNAL_TRAINING_DETAILS(identifier))
  }

}
