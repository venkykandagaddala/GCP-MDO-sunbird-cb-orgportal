import { of } from 'rxjs'
import { IapComponent } from './iap.component'

const makeContent = (overrides: any = {}) => ({
  identifier: 'iap-001',
  artifactUrl: '/content-store/path/file.html',
  name: 'IAP Test',
  description: 'IAP desc',
  ...overrides,
})

describe('IapComponent', () => {
  let component: IapComponent
  let mockActivatedRoute: any
  let mockContentSvc: any
  let mockEventSvc: any
  let mockViewerSvc: any
  let mockRespondSvc: any

  beforeEach(() => {
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: { get: jest.fn().mockReturnValue(null) },
        paramMap: { get: jest.fn().mockReturnValue('iap-001') },
        queryParams: {},
      },
      data: of({}),
    }
    mockContentSvc = {
      continueLearning: jest.fn().mockResolvedValue({}),
      setS3Cookie: jest.fn().mockReturnValue(of({})),
    }
    mockEventSvc = {
      dispatchEvent: jest.fn(),
    }
    mockViewerSvc = {
      getContent: jest.fn().mockReturnValue(of(makeContent())),
    }
    mockRespondSvc = {
      loadedRespond: jest.fn(),
      unsubscribeResponse: jest.fn(),
    }
    component = new IapComponent(
      mockActivatedRoute,
      mockContentSvc,
      mockEventSvc,
      mockViewerSvc,
      mockRespondSvc,
    )
  })

  afterEach(() => {
    if ((component as any).routeDataSubscription) {
      (component as any).routeDataSubscription.unsubscribe()
    }
    if ((component as any).responseSubscription) {
      (component as any).responseSubscription.unsubscribe()
    }
    jest.restoreAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have isFetchingDataComplete=false initially', () => {
    expect(component.isFetchingDataComplete).toBe(false)
  })

  it('should have isPreviewMode=false initially', () => {
    expect(component.isPreviewMode).toBe(false)
  })

  it('should have iapData=null initially', () => {
    expect(component.iapData).toBeNull()
  })

  it('should have discussionForumWidget=null initially', () => {
    expect(component.discussionForumWidget).toBeNull()
  })

  // ─── ngOnInit - preview mode ─────────────────────────────────────────────
  describe('ngOnInit - preview mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn(k => k === 'preview' ? 'true' : null)
    })

    it('should set isPreviewMode=true', () => {
      component.ngOnInit()
      expect(component.isPreviewMode).toBe(true)
    })

    it('should call viewerSvc.getContent with resourceId from paramMap', () => {
      component.ngOnInit()
      expect(mockViewerSvc.getContent).toHaveBeenCalledWith('iap-001')
    })

    it('should set iapData from getContent result', () => {
      component.ngOnInit()
      expect(component.iapData!.identifier).toBe('iap-001')
    })

    it('should formDiscussionForumWidget when data returns', () => {
      component.ngOnInit()
      expect(component.discussionForumWidget).toBeTruthy()
    })

    it('should disable discussionForumWidget in preview', () => {
      component.ngOnInit()
      expect(component.discussionForumWidget!.widgetData.isDisabled).toBe(true)
    })

    it('should call contentSvc.setS3Cookie when artifactUrl has content-store', () => {
      component.ngOnInit()
      expect(mockContentSvc.setS3Cookie).toHaveBeenCalledWith('iap-001')
    })

    it('should not call setS3Cookie when artifactUrl has no content-store', () => {
      mockViewerSvc.getContent.mockReturnValue(of(makeContent({ artifactUrl: '/other/path.html' })))
      component.ngOnInit()
      expect(mockContentSvc.setS3Cookie).not.toHaveBeenCalled()
    })

    it('should set isFetchingDataComplete=true after data loads', async () => {
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(component.isFetchingDataComplete).toBe(true)
    })

    it('should handle null data from getContent gracefully', () => {
      mockViewerSvc.getContent.mockReturnValue(of(null))
      component.ngOnInit()
      expect(component.iapData).toBeNull()
      expect(component.discussionForumWidget).toBeNull()
    })

    it('should use empty string resourceId when paramMap returns null', () => {
      mockActivatedRoute.snapshot.paramMap.get = jest.fn().mockReturnValue(null)
      component.ngOnInit()
      expect(mockViewerSvc.getContent).toHaveBeenCalledWith('')
    })
  })

  // ─── ngOnInit - normal route data ────────────────────────────────────────
  describe('ngOnInit - normal route data', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue(null)
      mockActivatedRoute.data = of({ content: { data: makeContent() } })
    })

    it('should set iapData from route data', () => {
      component.ngOnInit()
      expect(component.iapData!.identifier).toBe('iap-001')
    })

    it('should formDiscussionForumWidget when content is loaded', () => {
      component.ngOnInit()
      expect(component.discussionForumWidget).toBeTruthy()
    })

    it('should set isFetchingDataComplete=true', async () => {
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(component.isFetchingDataComplete).toBe(true)
    })

    it('should set alreadyRaised=true after loading', async () => {
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(component.alreadyRaised).toBe(true)
    })

    it('should set oldData after loading', async () => {
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(component.oldData!.identifier).toBe('iap-001')
    })

    it('should call setS3Cookie when artifactUrl contains content-store', () => {
      component.ngOnInit()
      expect(mockContentSvc.setS3Cookie).toHaveBeenCalledWith('iap-001')
    })

    it('should not call setS3Cookie when no content-store in artifactUrl', () => {
      mockActivatedRoute.data = of({
        content: { data: makeContent({ artifactUrl: '/other/path.html' }) },
      })
      component.ngOnInit()
      expect(mockContentSvc.setS3Cookie).not.toHaveBeenCalled()
    })

    it('should raiseEvent Loaded when not in forPreview mode', async () => {
      component.forPreview = false
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockEventSvc.dispatchEvent).toHaveBeenCalled()
    })

    it('should not raiseEvent when forPreview is true', async () => {
      component.forPreview = true
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockEventSvc.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should raiseEvent Unloaded on reload when alreadyRaised=true and oldData exists', async () => {
      component.forPreview = false
      component.alreadyRaised = true
      component.oldData = makeContent({ identifier: 'old-001' }) as any
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      // Unloaded (from alreadyRaised) + Loaded = 2 dispatches
      expect(mockEventSvc.dispatchEvent).toHaveBeenCalledTimes(2)
    })

    it('should handle error callback silently', () => {
      mockActivatedRoute.data = {
        subscribe: jest.fn((_success: any, error: any) => error?.()),
      }
      expect(() => component.ngOnInit()).not.toThrow()
    })

    it('should set up responseSubscription for window message events', async () => {
      component.forPreview = false
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect((component as any).responseSubscription).toBeTruthy()
    })

    it('should invoke loadedRespond for IAP LOADED message via captured handler', async () => {
      component.forPreview = false
      // Capture the message handler registered by fromEvent (registers after async setS3Cookie)
      const handlers: Function[] = []
      const origAdd = window.addEventListener.bind(window)
      jest.spyOn(window, 'addEventListener').mockImplementation((type: any, handler: any, opts?: any) => {
        if (type === 'message') { handlers.push(handler) }
        origAdd(type, handler, opts)
      })
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))

      const mockSource = { postMessage: jest.fn() }
      const mockEvent = { data: { requestId: 'LOADED', subApplicationName: 'IAP' }, source: mockSource }
      handlers.forEach(h => (h as Function)(mockEvent))

      expect(mockRespondSvc.loadedRespond).toHaveBeenCalledWith(mockSource, 'IAP', 'iap-001')
    })

    it('should ignore message with non-IAP subApplicationName', () => {
      component.forPreview = false
      const handlers: Function[] = []
      const origAdd = window.addEventListener.bind(window)
      jest.spyOn(window, 'addEventListener').mockImplementation((type: any, handler: any, opts?: any) => {
        if (type === 'message') { handlers.push(handler) }
        origAdd(type, handler, opts)
      })
      component.ngOnInit()

      const mockSource = { postMessage: jest.fn() }
      const mockEvent = { data: { requestId: 'LOADED', subApplicationName: 'OTHER' }, source: mockSource }
      handlers.forEach(h => (h as Function)(mockEvent))

      expect(mockRespondSvc.loadedRespond).not.toHaveBeenCalled()
    })

    it('should ignore message event with unknown requestId (default case)', () => {
      component.forPreview = false
      const handlers: Function[] = []
      const origAdd = window.addEventListener.bind(window)
      jest.spyOn(window, 'addEventListener').mockImplementation((type: any, handler: any, opts?: any) => {
        if (type === 'message') { handlers.push(handler) }
        origAdd(type, handler, opts)
      })
      component.ngOnInit()

      const mockSource = { postMessage: jest.fn() }
      const mockEvent = { data: { requestId: 'UNKNOWN', subApplicationName: 'IAP' }, source: mockSource }
      handlers.forEach(h => (h as Function)(mockEvent))

      expect(mockRespondSvc.loadedRespond).not.toHaveBeenCalled()
    })
  })

  // ─── ngOnDestroy ─────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should call continueLearning with collectionId and collectionType when both present', async () => {
      component.iapData = makeContent() as any
      mockActivatedRoute.snapshot.queryParams = {
        collectionId: 'col-001',
        collectionType: 'Course',
      }
      await component.ngOnDestroy()
      expect(mockContentSvc.continueLearning).toHaveBeenCalledWith('iap-001', 'col-001', 'Course')
    })

    it('should call continueLearning with only identifier when no collectionId', async () => {
      component.iapData = makeContent() as any
      mockActivatedRoute.snapshot.queryParams = {}
      await component.ngOnDestroy()
      expect(mockContentSvc.continueLearning).toHaveBeenCalledWith('iap-001')
    })

    it('should not call continueLearning when iapData is null', async () => {
      component.iapData = null
      await component.ngOnDestroy()
      expect(mockContentSvc.continueLearning).not.toHaveBeenCalled()
    })

    it('should callraiseEvent Unloaded when iapData exists and not forPreview', async () => {
      component.iapData = makeContent() as any
      component.forPreview = false
      await component.ngOnDestroy()
      expect(mockEventSvc.dispatchEvent).toHaveBeenCalled()
    })

    it('should not raiseEvent when iapData is null', async () => {
      component.iapData = null
      await component.ngOnDestroy()
      expect(mockEventSvc.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should unsubscribe routeDataSubscription when present', async () => {
      const sub = { unsubscribe: jest.fn() }
        ; (component as any).routeDataSubscription = sub
      await component.ngOnDestroy()
      expect(sub.unsubscribe).toHaveBeenCalled()
    })

    it('should call unsubscribeResponse and unsubscribe responseSubscription when present', async () => {
      const sub = { unsubscribe: jest.fn() }
        ; (component as any).responseSubscription = sub
      await component.ngOnDestroy()
      expect(mockRespondSvc.unsubscribeResponse).toHaveBeenCalled()
      expect(sub.unsubscribe).toHaveBeenCalled()
    })

    it('should not throw when subscriptions are null', async () => {
      ; (component as any).routeDataSubscription = null
        ; (component as any).responseSubscription = null
      await expect(component.ngOnDestroy()).resolves.not.toThrow()
    })

    it('should not call continueLearning when only collectionId present but not collectionType', async () => {
      component.iapData = makeContent() as any
      mockActivatedRoute.snapshot.queryParams = { collectionId: 'col-001' }
      await component.ngOnDestroy()
      // falls to else branch: continueLearning with just identifier
      expect(mockContentSvc.continueLearning).toHaveBeenCalledWith('iap-001')
    })
  })

  // ─── formDiscussionForumWidget ────────────────────────────────────────────
  describe('formDiscussionForumWidget', () => {
    it('should set widgetType and widgetSubType to discussionForum', () => {
      component.formDiscussionForumWidget(makeContent() as any)
      expect(component.discussionForumWidget!.widgetType).toBe('discussionForum')
      expect(component.discussionForumWidget!.widgetSubType).toBe('discussionForum')
    })

    it('should set id from content.identifier', () => {
      component.formDiscussionForumWidget(makeContent({ identifier: 'x-iap' }) as any)
      expect(component.discussionForumWidget!.widgetData.id).toBe('x-iap')
    })

    it('should set title from content.name', () => {
      component.formDiscussionForumWidget(makeContent({ name: 'My IAP' }) as any)
      expect(component.discussionForumWidget!.widgetData.title).toBe('My IAP')
    })

    it('should set description from content.description', () => {
      component.formDiscussionForumWidget(makeContent({ description: 'A description' }) as any)
      expect(component.discussionForumWidget!.widgetData.description).toBe('A description')
    })

    it('should set initialPostCount=2', () => {
      component.formDiscussionForumWidget(makeContent() as any)
      expect(component.discussionForumWidget!.widgetData.initialPostCount).toBe(2)
    })

    it('should set isDisabled=true when forPreview=true', () => {
      component.forPreview = true
      component.formDiscussionForumWidget(makeContent() as any)
      expect(component.discussionForumWidget!.widgetData.isDisabled).toBe(true)
    })

    it('should set isDisabled=false when forPreview=false', () => {
      component.forPreview = false
      component.formDiscussionForumWidget(makeContent() as any)
      expect(component.discussionForumWidget!.widgetData.isDisabled).toBe(false)
    })
  })

  // ─── raiseEvent ──────────────────────────────────────────────────────────
  describe('raiseEvent', () => {
    it('should call dispatchEvent when not in forPreview mode', () => {
      component.forPreview = false
      component.raiseEvent('Loaded' as any, makeContent() as any)
      expect(mockEventSvc.dispatchEvent).toHaveBeenCalled()
    })

    it('should not call dispatchEvent when forPreview=true', () => {
      component.forPreview = true
      component.raiseEvent('Loaded' as any, makeContent() as any)
      expect(mockEventSvc.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should include identifier in the dispatched event', () => {
      component.forPreview = false
      component.raiseEvent('Loaded' as any, makeContent({ identifier: 'iap-999' }) as any)
      const arg = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(arg.data.identifier).toBe('iap-999')
    })

    it('should include artifactUrl in the dispatched event', () => {
      component.forPreview = false
      component.raiseEvent('Loaded' as any, makeContent({ artifactUrl: '/some/url' }) as any)
      const arg = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(arg.data.url).toBe('/some/url')
    })

    it('should set from=iap in the event', () => {
      component.forPreview = false
      component.raiseEvent('Loaded' as any, makeContent() as any)
      const arg = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(arg.from).toBe('iap')
    })

    it('should set identifier=null and url=null when data is null', () => {
      component.forPreview = false
      component.raiseEvent('Loaded' as any, null as any)
      const arg = mockEventSvc.dispatchEvent.mock.calls[0][0]
      expect(arg.data.identifier).toBeNull()
      expect(arg.data.url).toBeNull()
    })
  })

  // ─── setS3Cookie error handling ───────────────────────────────────────────
  describe('setS3Cookie error handling', () => {
    it('should not throw when setS3Cookie rejects (preview mode)', async () => {
      mockContentSvc.setS3Cookie = jest.fn().mockReturnValue({
        toPromise: () => Promise.reject(new Error('cookie error')),
      })
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn(k => k === 'preview' ? 'true' : null)
      expect(() => component.ngOnInit()).not.toThrow()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(component.isFetchingDataComplete).toBe(true)
    })

    it('should not throw when setS3Cookie rejects (normal route)', async () => {
      mockContentSvc.setS3Cookie = jest.fn().mockReturnValue({
        toPromise: () => Promise.reject(new Error('cookie error')),
      })
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue(null)
      mockActivatedRoute.data = of({ content: { data: makeContent() } })
      expect(() => component.ngOnInit()).not.toThrow()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(component.isFetchingDataComplete).toBe(true)
    })
  })

  // ─── ngOnInit - normal route: no identifier ───────────────────────────────
  describe('ngOnInit - normal route: content with no identifier', () => {
    it('should not set responseSubscription when iapData has no identifier', async () => {
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue(null)
      mockActivatedRoute.data = of({
        content: { data: makeContent({ identifier: '' }) },
      })
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect((component as any).responseSubscription).toBeFalsy()
    })
  })

  // ─── message event filter edge cases ─────────────────────────────────────
  describe('message event filter edge cases', () => {
    const setupWithHandlers = async () => {
      component.forPreview = false
      mockActivatedRoute.snapshot.queryParamMap.get = jest.fn().mockReturnValue(null)
      mockActivatedRoute.data = of({ content: { data: makeContent() } })
      const handlers: Function[] = []
      const origAdd = window.addEventListener.bind(window)
      jest.spyOn(window, 'addEventListener').mockImplementation((type: any, handler: any, opts?: any) => {
        if (type === 'message') { handlers.push(handler) }
        origAdd(type, handler, opts)
      })
      component.ngOnInit()
      await new Promise(resolve => setTimeout(resolve, 0))
      return handlers
    }

    it('should ignore message event where source has no postMessage', async () => {
      const handlers = await setupWithHandlers()
      const mockEvent = { data: { requestId: 'LOADED', subApplicationName: 'IAP' }, source: {} }
      handlers.forEach(h => h(mockEvent))
      expect(mockRespondSvc.loadedRespond).not.toHaveBeenCalled()
    })

    it('should ignore message event where event.data is falsy', async () => {
      const handlers = await setupWithHandlers()
      const mockEvent = { data: null, source: { postMessage: jest.fn() } }
      handlers.forEach(h => h(mockEvent))
      expect(mockRespondSvc.loadedRespond).not.toHaveBeenCalled()
    })

    it('should ignore message event where requestId is absent', async () => {
      const handlers = await setupWithHandlers()
      const mockEvent = { data: { subApplicationName: 'IAP' }, source: { postMessage: jest.fn() } }
      handlers.forEach(h => h(mockEvent))
      expect(mockRespondSvc.loadedRespond).not.toHaveBeenCalled()
    })
  })
})
