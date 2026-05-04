import { of } from 'rxjs'
import { ResourceCollectionService } from './resource-collection.service'

const BASE = '/apis/protected/v8/user/exercise'

describe('ResourceCollectionService', () => {
  let service: ResourceCollectionService
  let mockHttp: any

  beforeEach(() => {
    mockHttp = {
      get: jest.fn().mockReturnValue(of([])),
      post: jest.fn().mockReturnValue(of({})),
    }
    service = new ResourceCollectionService(mockHttp)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ─── creation ─────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  // ─── getAllSubmission ──────────────────────────────────────────────────────

  describe('getAllSubmission', () => {
    it('should call http.get with correct URL', () => {
      service.getAllSubmission('assignment', 'content-001')
      expect(mockHttp.get).toHaveBeenCalledWith(
        `${BASE}/getSubmissions?type=assignment&contentId=content-001`,
      )
    })

    it('should return observable from http.get', (done) => {
      mockHttp.get.mockReturnValue(of([{ id: 'sub-1' }]))
      service.getAllSubmission('quiz', 'c1').subscribe((res: any) => {
        expect(res).toEqual([{ id: 'sub-1' }])
        done()
      })
    })

    it('should build URL with different type values', () => {
      service.getAllSubmission('quiz', 'c2')
      expect(mockHttp.get).toHaveBeenCalledWith(
        `${BASE}/getSubmissions?type=quiz&contentId=c2`,
      )
    })

    it('should build URL with empty type', () => {
      service.getAllSubmission('', 'c3')
      expect(mockHttp.get).toHaveBeenCalledWith(
        `${BASE}/getSubmissions?type=&contentId=c3`,
      )
    })
  })

  // ─── createContentDirectory ───────────────────────────────────────────────

  describe('createContentDirectory', () => {
    it('should call http.post with correct URL and null body', () => {
      service.createContentDirectory('content-001')
      expect(mockHttp.post).toHaveBeenCalledWith(
        `${BASE}/createContentDirectory/content-001`,
        null,
      )
    })

    it('should return observable from http.post', (done) => {
      mockHttp.post.mockReturnValue(of({ created: true }))
      service.createContentDirectory('c1').subscribe((res: any) => {
        expect(res).toEqual({ created: true })
        done()
      })
    })

    it('should build URL for different contentIds', () => {
      service.createContentDirectory('xyz-999')
      expect(mockHttp.post).toHaveBeenCalledWith(
        `${BASE}/createContentDirectory/xyz-999`,
        null,
      )
    })
  })

  // ─── uploadFile ───────────────────────────────────────────────────────────

  describe('uploadFile', () => {
    it('should call http.post with correct URL and formData', () => {
      const formData = new FormData()
      formData.append('file', new Blob(['content']), 'test.txt')
      service.uploadFile(formData, 'content-001')
      expect(mockHttp.post).toHaveBeenCalledWith(
        `${BASE}/uploadFileToContentDirectory/content-001`,
        formData,
      )
    })

    it('should return observable from http.post', (done) => {
      const formData = new FormData()
      mockHttp.post.mockReturnValue(of({ uploaded: true }))
      service.uploadFile(formData, 'c1').subscribe((res: any) => {
        expect(res).toEqual({ uploaded: true })
        done()
      })
    })

    it('should pass the exact formData reference', () => {
      const formData = new FormData()
      service.uploadFile(formData, 'c2')
      const [, bodyArg] = mockHttp.post.mock.calls[0]
      expect(bodyArg).toBe(formData)
    })
  })

  // ─── postSubmission ───────────────────────────────────────────────────────

  describe('postSubmission', () => {
    it('should call http.post with correct URL and requestData', () => {
      const payload = { answer: 'A' }
      service.postSubmission(payload, 'content-001')
      expect(mockHttp.post).toHaveBeenCalledWith(
        `${BASE}/postsubmission/content-001`,
        payload,
      )
    })

    it('should return observable from http.post', (done) => {
      mockHttp.post.mockReturnValue(of({ success: true }))
      service.postSubmission({ answer: 'B' }, 'c1').subscribe((res: any) => {
        expect(res).toEqual({ success: true })
        done()
      })
    })

    it('should pass the exact requestData reference', () => {
      const payload = { answer: 'C', score: 10 }
      service.postSubmission(payload, 'c3')
      const [, bodyArg] = mockHttp.post.mock.calls[0]
      expect(bodyArg).toBe(payload)
    })

    it('should accept null as requestData', () => {
      service.postSubmission(null, 'c4')
      expect(mockHttp.post).toHaveBeenCalledWith(
        `${BASE}/postsubmission/c4`,
        null,
      )
    })
  })

  // ─── readContentTextFile ──────────────────────────────────────────────────

  describe('readContentTextFile', () => {
    it('should call http.get with url and responseType text', () => {
      service.readContentTextFile('https://example.com/file.txt')
      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://example.com/file.txt',
        { responseType: 'text' },
      )
    })

    it('should return observable from http.get', (done) => {
      mockHttp.get.mockReturnValue(of('file contents'))
      service.readContentTextFile('https://example.com/data.txt').subscribe((res: any) => {
        expect(res).toBe('file contents')
        done()
      })
    })

    it('should work with relative URLs', () => {
      service.readContentTextFile('/assets/content.txt')
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/assets/content.txt',
        { responseType: 'text' },
      )
    })

    it('should work with empty string url', () => {
      service.readContentTextFile('')
      expect(mockHttp.get).toHaveBeenCalledWith('', { responseType: 'text' })
    })
  })

  // ─── END_POINTS URL builder edge cases ────────────────────────────────────

  describe('URL builders', () => {
    it('getAllSubmission URL includes both type and contentId', () => {
      service.getAllSubmission('type1', 'id1')
      const url: string = mockHttp.get.mock.calls[0][0]
      expect(url).toContain('type=type1')
      expect(url).toContain('contentId=id1')
    })

    it('createContentDirectory URL includes contentId segment', () => {
      service.createContentDirectory('seg-123')
      const url: string = mockHttp.post.mock.calls[0][0]
      expect(url).toContain('seg-123')
      expect(url).toContain('createContentDirectory')
    })

    it('uploadFile URL includes contentId segment', () => {
      service.uploadFile(new FormData(), 'seg-456')
      const url: string = mockHttp.post.mock.calls[0][0]
      expect(url).toContain('seg-456')
      expect(url).toContain('uploadFileToContentDirectory')
    })

    it('postSubmission URL includes contentId segment', () => {
      service.postSubmission({}, 'seg-789')
      const url: string = mockHttp.post.mock.calls[0][0]
      expect(url).toContain('seg-789')
      expect(url).toContain('postsubmission')
    })
  })
})
