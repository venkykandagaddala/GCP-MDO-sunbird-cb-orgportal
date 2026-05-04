// Mock ViewerUtilService to prevent transitive ESM import issues (jspdf)
jest.mock('../../viewer-util.service', () => ({
  ViewerUtilService: jest.fn(),
}))

// Mock environment so generateUrl is deterministic in tests
jest.mock('src/environments/environment', () => ({
  environment: {
    azureHost: 'https://mock-host.com/path',
    azureBucket: 'mock-bucket',
  },
}))

import { Subject, of } from 'rxjs'
import { OfflineSessionComponent } from './offline-session.component'
import { WsEvents } from '@sunbird-cb/utils-v2'
import { NsContent } from '@sunbird-cb/collection'

const buildContent = (overrides: any = {}): any => ({
  identifier: 'os-001',
  name: 'Offline Session Test',
  description: 'An offline session',
  artifactUrl: 'https://example.com/content-store/session.html',
  mimeType: 'application/vnd.ekstep.html-archive',
  contentType: 'OfflineSession',
  primaryCategory: 'Offline Session',
  version: 1,
  ...overrides,
})

describe('OfflineSessionComponent', () => {
  let component: OfflineSessionComponent
  let mockActivatedRoute: any
  let mockContentSvc: any
  let mockEventSvc: any
  let mockViewerSvc: any
  let mockAccessControlSvc: any
  let mockConfigSvc: any

  beforeEach(() => {
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jest.fn().mockReturnValue(null),
        },
        queryParams: {},
        params: { resourceId: 'session-001' },
      },
      data: new Subject<any>(),
    }

    mockContentSvc = {
      setS3Cookie: jest.fn().mockReturnValue(of(null)),
      continueLearning: jest.fn().mockResolvedValue(undefined),
      fetchCourseBatch: jest.fn().mockReturnValue(of({ result: { response: {} } })),
      fetchContentHistoryV2: jest.fn().mockReturnValue(of({ result: { contentList: [] } })),
      setProgramChildResumeData: jest.fn(),
    }

    mockEventSvc = {
      dispatchEvent: jest.fn(),
    }

    mockViewerSvc = {
      getAuthoringUrl: jest.fn((url: string) => `authoring://${url}`),
      getBatchIdAndCourseId: jest.fn().mockReturnValue({ batchId: 'batch-001', courseId: 'course-001' }),
    }

    mockAccessControlSvc = {
      authoringConfig: { newDesign: false },
    }

    mockConfigSvc = {
      userProfile: { userId: 'user-001' },
    }

    component = new OfflineSessionComponent(
      mockActivatedRoute,
      mockContentSvc,
      mockEventSvc,
      mockViewerSvc,
      mockAccessControlSvc,
      mockConfigSvc,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ─── initialization ────────────────────────────────────────────────────────

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy()
    })

    it('should have isFetchingDataComplete false by default', () => {
      expect(component.isFetchingDataComplete).toBe(false)
    })

    it('should have alreadyRaised false by default', () => {
      expect(component.alreadyRaised).toBe(false)
    })

    it('should have offlineSessionData null by default', () => {
      expect(component.offlineSessionData).toBeNull()
    })

    it('should have isPreviewMode false by default', () => {
      expect(component.isPreviewMode).toBe(false)
    })

    it('should have discussionForumWidget null by default', () => {
      expect(component.discussionForumWidget).toBeNull()
    })

    it('should have widgetResolverOfflineSessionData with expected widgetType', () => {
      expect(component.widgetResolverOfflineSessionData.widgetType).toBe('player')
      expect(component.widgetResolverOfflineSessionData.widgetSubType).toBe('playerOfflineSession')
    })

    it('should initialise batchId from queryParamMap', () => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue('batch-xyz')
      const c = new OfflineSessionComponent(
        mockActivatedRoute, mockContentSvc, mockEventSvc,
        mockViewerSvc, mockAccessControlSvc, mockConfigSvc,
      )
      expect(c.batchId).toBe('batch-xyz')
    })
  })

  // ─── formDiscussionForumWidget ─────────────────────────────────────────────

  describe('formDiscussionForumWidget', () => {
    it('should set discussionForumWidget with content data', () => {
      const content = buildContent()
      component.formDiscussionForumWidget(content)
      expect(component.discussionForumWidget).not.toBeNull()
      expect(component.discussionForumWidget!.widgetData.id).toBe('os-001')
      expect(component.discussionForumWidget!.widgetData.title).toBe('Offline Session Test')
      expect(component.discussionForumWidget!.widgetData.description).toBe('An offline session')
      expect(component.discussionForumWidget!.widgetSubType).toBe('discussionForum')
      expect(component.discussionForumWidget!.widgetType).toBe('discussionForum')
    })

    it('should set name to EDiscussionType.LEARNING', () => {
      component.formDiscussionForumWidget(buildContent())
      expect(component.discussionForumWidget!.widgetData.name).toBe('Learning')
    })

    it('should set initialPostCount to 2', () => {
      component.formDiscussionForumWidget(buildContent())
      expect(component.discussionForumWidget!.widgetData.initialPostCount).toBe(2)
    })

    it('should set isDisabled=true when forPreview is true', () => {
      component.forPreview = true
      component.formDiscussionForumWidget(buildContent())
      expect(component.discussionForumWidget!.widgetData.isDisabled).toBe(true)
    })

    it('should set isDisabled=false when forPreview is false', () => {
      component.forPreview = false
      component.formDiscussionForumWidget(buildContent())
      expect(component.discussionForumWidget!.widgetData.isDisabled).toBe(false)
    })
  })

  // ─── raiseEvent ───────────────────────────────────────────────────────────

  describe('raiseEvent', () => {
    it('should dispatch event', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, buildContent())
      expect(mockEventSvc.dispatchEvent).toHaveBeenCalledTimes(1)
    })

    it('should dispatch event with correct state', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Unloaded, buildContent())
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.data.state).toBe(WsEvents.EnumTelemetrySubType.Unloaded)
    })

    it('should set from to OfflineSession', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, buildContent())
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.from).toBe('OfflineSession')
    })

    it('should set mimeType to OFFLINE_SESSION', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, buildContent())
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.data.mimeType).toBe(NsContent.EMimeTypes.OFFLINE_SESSION)
    })

    it('should set identifier from data', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, buildContent({ identifier: 'os-999' }))
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.data.identifier).toBe('os-999')
    })

    it('should set identifier=null and url=null when data is null', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, null as any)
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.data.identifier).toBeNull()
      expect(dispatched.data.url).toBeNull()
    })

    it('should include rollup with collectionId from widgetData', () => {
      component.widgetResolverOfflineSessionData.widgetData.collectionId = 'col-777'
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, buildContent())
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.data.object.rollup.l1).toBe('col-777')
    })

    it('should set object.type from primaryCategory', () => {
      component.raiseEvent(WsEvents.EnumTelemetrySubType.Loaded, buildContent({ primaryCategory: 'Course' }))
      const dispatched = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(dispatched.data.object.type).toBe('Course')
    })
  })

  // ─── generateUrl ──────────────────────────────────────────────────────────

  describe('generateUrl', () => {
    it('should replace host at index 2 and bucket at index 3', () => {
      const result = component.generateUrl('https://old-host.com/old-bucket/path/file.html')
      // newChunk[2] from 'https://mock-host.com/path' → 'mock-host.com'
      expect(result).toBe('https://mock-host.com/mock-bucket/path/file.html')
    })

    it('should preserve path segments beyond index 3', () => {
      const result = component.generateUrl('https://old-host.com/bucket/a/b/c/file.txt')
      expect(result).toContain('/a/b/c/file.txt')
    })

    it('should use azureBucket for index 3', () => {
      const result = component.generateUrl('https://old-host.com/orig-bucket/path')
      expect(result).toContain('mock-bucket')
    })

    it('should return joined URL', () => {
      const result = component.generateUrl('https://host.com/bucket/file')
      expect(typeof result).toBe('string')
      expect(result.startsWith('https://')).toBe(true)
    })
  })

  // ─── ngOnInit - normal route ───────────────────────────────────────────────

  describe('ngOnInit - normal route', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue(null)
      // prevent getSessionData from calling initData (batchData without sessionDetails_v2)
      mockContentSvc.fetchCourseBatch = jest.fn().mockReturnValue(of({ result: { response: {} } }))
    })

    it('should set offlineSessionData from route data', async () => {
      const content = buildContent()
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: content } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.offlineSessionData).toBe(content)
    })

    it('should call formDiscussionForumWidget with content', async () => {
      const content = buildContent()
      const spy = jest.spyOn(component, 'formDiscussionForumWidget')
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: content } })
      await new Promise(r => setTimeout(r, 10))
      expect(spy).toHaveBeenCalledWith(content)
    })

    it('should call setS3Cookie when artifactUrl contains content-store', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(mockContentSvc.setS3Cookie).toHaveBeenCalledWith('os-001')
    })

    it('should not call setS3Cookie when artifactUrl lacks content-store', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent({ artifactUrl: 'https://other.com/file.html' }) } })
      await new Promise(r => setTimeout(r, 10))
      expect(mockContentSvc.setS3Cookie).not.toHaveBeenCalled()
    })

    it('should set isFetchingDataComplete=true after processing', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.isFetchingDataComplete).toBe(true)
    })

    it('should set alreadyRaised=true after first emission', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.alreadyRaised).toBe(true)
    })

    it('should set oldData after first emission', async () => {
      const content = buildContent()
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: content } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.oldData).toBe(content)
    })

    it('should raise Loaded event on first emission', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      const states = mockEventSvc.dispatchEvent.mock.calls.map((c: any) => c[0].data.state)
      expect(states).toContain(WsEvents.EnumTelemetrySubType.Loaded)
    })

    it('should raise Unloaded for oldData on second emission', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent({ identifier: 'id1' }) } })
      await new Promise(r => setTimeout(r, 10))
      mockActivatedRoute.data.next({ content: { data: buildContent({ identifier: 'id2' }) } })
      await new Promise(r => setTimeout(r, 10))
      const states = mockEventSvc.dispatchEvent.mock.calls.map((c: any) => c[0].data.state)
      expect(states).toContain(WsEvents.EnumTelemetrySubType.Unloaded)
    })

    it('should set widgetData.collectionId from queryParams when present', async () => {
      mockActivatedRoute.snapshot.queryParams = { collectionId: 'col-abc' }
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.widgetResolverOfflineSessionData.widgetData.collectionId).toBe('col-abc')
    })

    it('should set widgetData.collectionId to empty string when not in queryParams', async () => {
      mockActivatedRoute.snapshot.queryParams = {}
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.widgetResolverOfflineSessionData.widgetData.collectionId).toBe('')
    })

    it('should set widgetData.identifier from offlineSessionData', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.widgetResolverOfflineSessionData.widgetData.identifier).toBe('os-001')
    })

    it('should set widgetData.mimeType from offlineSessionData', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.widgetResolverOfflineSessionData.widgetData.mimeType).toBeDefined()
    })

    it('should call fetchProgramBatchData when batchData is not set', async () => {
      const spy = jest.spyOn(component as any, 'fetchProgramBatchData' as any)
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(spy).toHaveBeenCalled()
    })

    it('should call getSessionData when batchData is already set', async () => {
      component.batchData = { batchAttributes: {} }
      const spy = jest.spyOn(component as any, 'getSessionData' as any)
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(spy).toHaveBeenCalled()
    })

    it('should handle null offlineSessionData gracefully', async () => {
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: null } })
      await new Promise(r => setTimeout(r, 10))
      expect(component.isFetchingDataComplete).toBe(true)
    })

    it('should not throw on error callback', () => {
      mockActivatedRoute.data = {
        subscribe: jest.fn((_next: any, error: any) => error?.()),
      }
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  // ─── ngOnInit - preview mode ───────────────────────────────────────────────

  describe('ngOnInit - preview mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue('true')
      mockAccessControlSvc.authoringConfig = { newDesign: false }
    })

    it('should set isPreviewMode=true', () => {
      component.ngOnInit()
      expect(component.isPreviewMode).toBe(true)
    })

    it('should subscribe via viewerDataSubscription', () => {
      component.ngOnInit()
      expect((component as any).viewerDataSubscription).toBeTruthy()
    })

    it('should call fetchProgramBatchData when batchData is not set', async () => {
      const spy = jest.spyOn(component as any, 'fetchProgramBatchData' as any)
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(spy).toHaveBeenCalled()
    })

    it('should call getSessionData when batchData is set', async () => {
      component.batchData = { batchAttributes: {} }
      const spy = jest.spyOn(component as any, 'getSessionData' as any)
      component.ngOnInit()
      mockActivatedRoute.data.next({ content: { data: buildContent() } })
      await new Promise(r => setTimeout(r, 10))
      expect(spy).toHaveBeenCalled()
    })

    it('should not set isPreviewMode=true when newDesign is true', () => {
      mockAccessControlSvc.authoringConfig = { newDesign: true }
      const c = new OfflineSessionComponent(
        mockActivatedRoute, mockContentSvc, mockEventSvc,
        mockViewerSvc, mockAccessControlSvc, mockConfigSvc,
      )
      c.ngOnInit()
      expect(c.isPreviewMode).toBe(false)
    })
  })

  // ─── fetchProgramBatchData ─────────────────────────────────────────────────

  describe('fetchProgramBatchData', () => {
    it('should call fetchCourseBatch with batchId from queryParamMap', () => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue('batch-999')
      const c = new OfflineSessionComponent(
        mockActivatedRoute, mockContentSvc, mockEventSvc,
        mockViewerSvc, mockAccessControlSvc, mockConfigSvc,
      )
      c.fetchProgramBatchData({})
      expect(mockContentSvc.fetchCourseBatch).toHaveBeenCalledWith('batch-999')
    })

    it('should set batchData from response', () => {
      const batchResult = { id: 'b1', batchAttributes: {} }
      mockContentSvc.fetchCourseBatch = jest.fn().mockReturnValue(of({ result: { response: batchResult } }))
      component.fetchProgramBatchData({})
      expect(component.batchData).toBe(batchResult)
    })

    it('should call getSessionData after batch response', () => {
      const spy = jest.spyOn(component as any, 'getSessionData' as any)
      component.fetchProgramBatchData({ content: { data: buildContent() } })
      expect(spy).toHaveBeenCalled()
    })

    it('should not set batchData when response.result is absent', () => {
      mockContentSvc.fetchCourseBatch = jest.fn().mockReturnValue(of({}))
      component.fetchProgramBatchData({})
      expect(component.batchData).toBeUndefined()
    })
  })

  // ─── getSessionData ────────────────────────────────────────────────────────

  describe('getSessionData', () => {
    const buildBatchData = (sessionId = 'session-001') => ({
      batchAttributes: {
        sessionDetails_v2: [
          { sessionId, topic: 'Test Topic' },
        ],
      },
    })

    it('should not call initData when batchData lacks batchAttributes', () => {
      component.batchData = {}
      const spy = jest.spyOn(component as any, 'initData' as any)
      component.getSessionData({ content: { data: buildContent() } })
      expect(spy).not.toHaveBeenCalled()
    })

    it('should call initData when batchData has sessionDetails_v2', () => {
      component.batchData = buildBatchData()
      const spy = jest.spyOn(component as any, 'initData' as any)
      component.getSessionData({ content: { data: buildContent() } })
      expect(spy).toHaveBeenCalled()
    })

    it('should call fetchContentHistoryV2 when collectionId, batchId and resourceId are all present', () => {
      component.batchData = buildBatchData()
      mockActivatedRoute.snapshot.queryParams = {
        collectionId: 'col-001',
        batchId: 'batch-001',
      }
      mockActivatedRoute.snapshot.params = { resourceId: 'session-001' }
      component.getSessionData({ content: { data: buildContent() } })
      expect(mockContentSvc.fetchContentHistoryV2).toHaveBeenCalled()
    })

    it('should not call fetchContentHistoryV2 when collectionId is absent', () => {
      component.batchData = buildBatchData()
      mockActivatedRoute.snapshot.queryParams = {}
      mockActivatedRoute.snapshot.params = { resourceId: 'session-001' }
      component.getSessionData({ content: { data: buildContent() } })
      expect(mockContentSvc.fetchContentHistoryV2).not.toHaveBeenCalled()
    })

    it('should call setProgramChildResumeData when contentList is non-empty', () => {
      component.batchData = buildBatchData()
      mockActivatedRoute.snapshot.queryParams = { collectionId: 'col-001', batchId: 'batch-001' }
      mockActivatedRoute.snapshot.params = { resourceId: 'session-001' }
      mockContentSvc.fetchContentHistoryV2 = jest.fn().mockReturnValue(of({
        result: { contentList: [{ contentId: 'other', completionPercentage: 50, status: 1, lastCompletedTime: '' }] },
      }))
      component.getSessionData({ content: { data: buildContent() } })
      expect(mockContentSvc.setProgramChildResumeData).toHaveBeenCalled()
    })

    it('should update sessionData with completion info for matching contentId', () => {
      const sessionObj = { sessionId: 'session-001' }
      component.batchData = {
        batchAttributes: { sessionDetails_v2: [sessionObj] },
      }
      mockActivatedRoute.snapshot.queryParams = { collectionId: 'col-001', batchId: 'batch-001' }
      mockActivatedRoute.snapshot.params = { resourceId: 'session-001' }
      mockContentSvc.fetchContentHistoryV2 = jest.fn().mockReturnValue(of({
        result: {
          contentList: [
            { contentId: 'session-001', completionPercentage: 80, status: 2, lastCompletedTime: '2026-01-01' },
          ],
        },
      }))
      component.getSessionData({ content: { data: buildContent() } })
      expect(sessionObj).toMatchObject({ completionPercentage: 80, completionStatus: 2 })
    })

    it('should use empty userId when userProfile is null', () => {
      mockConfigSvc.userProfile = null
      component.batchData = buildBatchData()
      mockActivatedRoute.snapshot.queryParams = { collectionId: 'col-001', batchId: 'batch-001' }
      mockActivatedRoute.snapshot.params = { resourceId: 'session-001' }
      expect(() => component.getSessionData({ content: { data: buildContent() } })).not.toThrow()
    })
  })

  // ─── initData ─────────────────────────────────────────────────────────────

  describe('initData', () => {
    it('should set offlineSessionData from data', () => {
      const content = buildContent()
      component.initData({ content: { data: content } })
      expect(component.offlineSessionData).toBe(content)
    })

    it('should call formDiscussionForumWidget', () => {
      const spy = jest.spyOn(component, 'formDiscussionForumWidget')
      component.initData({ content: { data: buildContent() } })
      expect(spy).toHaveBeenCalled()
    })

    it('should set discussionForumWidget.widgetData.isDisabled=true', () => {
      component.initData({ content: { data: buildContent() } })
      expect(component.discussionForumWidget!.widgetData.isDisabled).toBe(true)
    })

    it('should set collectionId from queryParams when present', () => {
      mockActivatedRoute.snapshot.queryParams = { collectionId: 'col-init' }
      component.initData({ content: { data: buildContent() } })
      expect(component.widgetResolverOfflineSessionData.widgetData.collectionId).toBe('col-init')
    })

    it('should set collectionId to empty string when not in queryParams', () => {
      mockActivatedRoute.snapshot.queryParams = {}
      component.initData({ content: { data: buildContent() } })
      expect(component.widgetResolverOfflineSessionData.widgetData.collectionId).toBe('')
    })

    it('should set widgetData.identifier from offlineSessionData', () => {
      component.initData({ content: { data: buildContent({ identifier: 'os-init-001' }) } })
      expect(component.widgetResolverOfflineSessionData.widgetData.identifier).toBe('os-init-001')
    })

    it('should set widgetData.disableTelemetry=true', () => {
      component.initData({ content: { data: buildContent() } })
      expect(component.widgetResolverOfflineSessionData.widgetData.disableTelemetry).toBe(true)
    })

    it('should set isFetchingDataComplete=true', () => {
      component.initData({ content: { data: buildContent() } })
      expect(component.isFetchingDataComplete).toBe(true)
    })

    it('should set OfflineSessionUrl via generateUrl', () => {
      component.initData({ content: { data: buildContent() } })
      expect(component.widgetResolverOfflineSessionData.widgetData.OfflineSessionUrl).toContain('mock-host.com')
    })
  })

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should raise Unloaded event when offlineSessionData exists', () => {
      component.offlineSessionData = buildContent()
      component.ngOnDestroy()
      const states = mockEventSvc.dispatchEvent.mock.calls.map((c: any) => c[0].data.state)
      expect(states).toContain(WsEvents.EnumTelemetrySubType.Unloaded)
    })

    it('should not raise event when offlineSessionData is null', () => {
      component.offlineSessionData = null
      component.ngOnDestroy()
      expect(mockEventSvc.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should unsubscribe dataSubscription', () => {
      const sub = { unsubscribe: jest.fn() }
        ; (component as any).dataSubscription = sub
      component.offlineSessionData = null
      component.ngOnDestroy()
      expect(sub.unsubscribe).toHaveBeenCalled()
    })

    it('should unsubscribe viewerDataSubscription', () => {
      const sub = { unsubscribe: jest.fn() }
        ; (component as any).viewerDataSubscription = sub
      component.offlineSessionData = null
      component.ngOnDestroy()
      expect(sub.unsubscribe).toHaveBeenCalled()
    })

    it('should unsubscribe telemetryIntervalSubscription', () => {
      const sub = { unsubscribe: jest.fn() }
        ; (component as any).telemetryIntervalSubscription = sub
      component.offlineSessionData = null
      component.ngOnDestroy()
      expect(sub.unsubscribe).toHaveBeenCalled()
    })

    it('should not throw when all subscriptions are null', () => {
      ; (component as any).dataSubscription = null
        ; (component as any).viewerDataSubscription = null
        ; (component as any).telemetryIntervalSubscription = null
      component.offlineSessionData = null
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
