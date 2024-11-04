import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { BlendedApporvalService } from '../../services/blended-approval.service'
import { BatchDetailsComponent } from './batch-details.component'
import { EventService } from '@sunbird-cb/utils'
import { of } from 'rxjs'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import * as moment from 'moment'
import { NsContent } from '../../../../head/_services/widget-content.model'
import * as _ from 'lodash'


describe('BatchDetailsComponent', () => {
  let component: BatchDetailsComponent

  const router: Partial<Router> = {
    getCurrentNavigation: jest.fn()

  }
  const activeRouter: Partial<ActivatedRoute> = {
    snapshot: {
      parent: {
        params: { id: '1' },
        snapshot: {
          data: {
            configService: {

            }
          }
        }
      },
      params: { id: '1', batchid: '12' },
      queryParams: of({ roleId: 'testRoleId' }),
    } as any,
    queryParams: of({ someParam: 'initialValue' }),
    // parent: {
    //     snapshot: {
    //         data: {
    //             configService: {
    //                 unMappedUser: { name: 'John Doe', role: 'User' }
    //             },
    //         }
    //         url: 'path/to/parent',
    //         params: jest.fn(),
    //         queryParams: jest.fn(),
    //         fragment: ''
    //     },

    // }

  }
  const bpService: Partial<BlendedApporvalService> = {
    getBlendedProgramsDetails: jest.fn().mockReturnValue(of({
      result: {
        content: {
          name: "testing",
          identifier: "12121",
          wfApprovalType: "something",
          batches: [{
            id: 1
          },
          {
            id: 2
          },
          ]
        }
      }
    })),
    getLearners: jest.fn(() => of({
      result: [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
        {
          userInfo: { first_name: 'Alice' },
          wfInfo: [{ deptName: 'Finance' }],
        },
      ]
    })),
    getRequests: jest.fn(() => of({
      result: {
        data: [
          {
            userInfo: { first_name: 'John' },
            wfInfo: [{ deptName: 'Engineering' }],
          },
          {
            userInfo: { first_name: 'Jane' },
            wfInfo: [{ deptName: 'Human Resources' }],
          },
          {
            userInfo: { first_name: 'Alice' },
            wfInfo: [{ deptName: 'Finance' }],
          },
        ]
      }
    })),
    getSerchRequests: jest.fn(() => of({
      result: {
        data: [
          {
            userInfo: { first_name: 'John' },
            wfInfo: [{ deptName: 'Engineering' }],
          },
          {
            userInfo: { first_name: 'Jane' },
            wfInfo: [{ deptName: 'Human Resources' }],
          },
          {
            userInfo: { first_name: 'Alice' },
            wfInfo: [{ deptName: 'Finance' }],
          },
        ]
      },
      updateBlendedRequests: jest.fn().mockReturnValue({
        subscribe: jest.fn((success) => success({})),
      }),
    })),

    getLearnersWithoutOrg: jest.fn(() => of({
      result: [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
        {
          userInfo: { first_name: 'Alice' },
          wfInfo: [{ deptName: 'Finance' }],
        },
      ]
    })),

  }
  const snackBar: Partial<MatSnackBar> = {
    open: jest.fn()
  }
  const events: Partial<EventService> = {
    raiseInteractTelemetry: jest.fn(),
  }
  const dialogue: Partial<MatDialog> = {}

  beforeAll(() => {
    component = new BatchDetailsComponent(
      router as Router,
      activeRouter as ActivatedRoute,
      bpService as BlendedApporvalService,
      snackBar as MatSnackBar,
      events as EventService,
      dialogue as MatDialog
    )
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  it('should create a instance of component', () => {
    expect(component).toBeTruthy()
  })

  describe('getBPDetails', () => {
    it('should set programData, batchData, breadcrumbs, and linkData when data is retrieved successfully', () => {
      const programID = '123'
      const mockResponse = {
        result: {
          content: {
            name: 'Sample Program',
            identifier: 'program123',
            wfApprovalType: 'ApprovalType',
            batches: [{ batchId: 'batch1', name: 'Batch 1' }]
          }
        }
      }

      jest.spyOn(bpService, 'getBlendedProgramsDetails').mockReturnValue(of(mockResponse))
      component.batchID = 'batch1'

      component.getBPDetails(programID)

      expect(component.programData).toEqual(mockResponse.result.content)
      expect(component.batchData).toEqual({ batchId: 'batch1', name: 'Batch 1' })
      expect(component.breadcrumbs).toEqual({
        titles: [
          { title: 'Blended programs', url: '/app/home/blended-approvals' },
          { title: 'Sample Program', url: `/app/blended-approvals/program123/batches` },
          { title: 'Batch 1', url: 'none' }
        ]
      })
      expect(component.linkData).toEqual({
        programName: 'Sample Program',
        programID: 'program123',
        batchName: 'Batch 1',
        batchID: 'batch1',
        approvalType: 'ApprovalType'
      })
    })
  })

  describe('filter', () => {
    beforeEach(() => {
      jest.spyOn(component, 'getNewRequestsList').mockImplementation()
      jest.spyOn(component, 'getLearnersList').mockImplementation()
      jest.spyOn(component, 'getRejectedList').mockImplementation()
      jest.spyOn(component, 'getSessionDetails').mockImplementation()
      jest.spyOn(component, 'getApprovalStatusList').mockImplementation()
      jest.spyOn(component, 'raiseTelemetry').mockImplementation()
      component.approvedUsers = []
      component.rejectedUsers = []
      component.newUsers = []
    })
    it('should set currentFilter to "pending" and call getNewRequestsList', () => {
      component.filter('pending')
      expect(component.currentFilter).toBe('pending')
      expect(component.getNewRequestsList).toHaveBeenCalled()
      expect(component.raiseTelemetry).toHaveBeenCalledWith('pending', TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT)
    })

    it('should set currentFilter to "approved" and call getLearnersList', () => {
      component.filter('approved')
      expect(component.currentFilter).toBe('approved')
      expect(component.getLearnersList).toHaveBeenCalled()
      expect(component.raiseTelemetry).toHaveBeenCalledWith('approved', TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT)
    })

    it('should set currentFilter to "rejected" and call getRejectedList', () => {
      component.filter('rejected')
      expect(component.currentFilter).toBe('rejected')
      expect(component.getRejectedList).toHaveBeenCalled()
      expect(component.raiseTelemetry).toHaveBeenCalledWith('rejected', TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT)
    })

    it('should set currentFilter to "sessions" and call getSessionDetails', () => {
      component.filter('sessions')
      expect(component.currentFilter).toBe('sessions')
      expect(component.getSessionDetails).toHaveBeenCalled()
      expect(component.raiseTelemetry).toHaveBeenCalledWith('sessions', TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT)
    })

    it('should set currentFilter to "approvalStatus" and call getApprovalStatusList', () => {
      component.filter('approvalStatus')
      expect(component.currentFilter).toBe('approvalStatus')
      expect(component.getApprovalStatusList).toHaveBeenCalled()
      expect(component.raiseTelemetry).toHaveBeenCalledWith('approvalStatus', TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT)
    })
  })

  // describe('getLearnersList()', () => {
  //   beforeEach(() => {
  //     component.batchData = { batchId: 'testBatchId' }
  //     component.userProfile = { channel: 'testChannel' }
  //     component.getAllLearner = jest.fn()
  //     //jest.spyOn(component, 'getAllLearner').mockImplementation()
  //   })

  //   it('should set approvedUsers and clonedApprovedUsers based on response', () => {
  //     component.currentFilter = 'approved'
  //     component.batchData = { batchId: 'testBatchId' }
  //     component.userProfile = { channel: 'testChannel' }
  //     const mockResponse = [
  //       {
  //         "city": "",
  //         "department": "Agrinnovate India",
  //         "desc": "",
  //         "designation": "ACCOUNTANT GENERAL",
  //         "email": "dev.agri.user4@yopmail.com",
  //         "first_name": "Dev Agri Userfour",
  //         "last_name": null,
  //         "phone_No": "8989890909",
  //         "userLocation": "",
  //         "user_id": "b12cc4a7-3759-4dce-82ae-aaf7d59c8647"
  //       },
  //       {
  //         "city": "",
  //         "department": "Finance And Budget",
  //         "desc": "",
  //         "designation": "A",
  //         "email": "dev.fnb.userone@yopmail.com",
  //         "first_name": "Lashawn Beatty",
  //         "last_name": null,
  //         "phone_No": "8921697813",
  //         "userLocation": "",
  //         "user_id": "a707c493-5d12-4ac5-ab61-228433be6edd"
  //       }]
  //     jest.spyOn(bpService, 'getLearners').mockReturnValue(of(mockResponse))

  //     console.log("component ", component.userProfile)
  //     console.log("component ", component.batchData)

  //     component.getLearnersList()
  //     console.log("dsd ", component.getLearnersList())

  //     expect(bpService.getLearners).toHaveBeenCalledWith('testBatchId', 'testChannel')
  //     expect(component.approvedUsers).toEqual(mockResponse)
  //     expect(component.clonedApprovedUsers).toEqual(mockResponse)
  //     expect(component.getAllLearner).toHaveBeenCalled()
  //   })

  //   it('should not set approvedUsers or clonedApprovedUsers if response is empty', () => {
  //     jest.spyOn(bpService, 'getLearners').mockReturnValue(of([]))

  //     component.getLearnersList()

  //     expect(component.approvedUsers).toEqual([])
  //     expect(component.clonedApprovedUsers).toEqual([])
  //   })

  // })


  // describe('getNewRequestsList', () => {
  //     beforeEach(() => {
  //         // component.batchData = { batchId: 'testBatchId' }
  //         // component.userProfile = { rootOrg: { orgName: 'testOrg' } }
  //         // component.filter('pending')
  //         // component.currentFilter = 'pending'
  //         // jest.spyOn(component, 'getAllLearner').mockImplementation()
  //     })
  //     it('should call getRequests with the correct request object', () => {
  //         component.currentFilter = 'pending'
  //         console.log(component.currentFilter)
  //         component.batchData = { batchId: 'testBatchId' }
  //         component.userProfile = { rootOrg: { orgName: 'testOrg' } }
  //         jest.spyOn(component, 'getAllLearner')

  //         const request = {
  //             serviceName: 'blendedprogram',
  //             applicationStatus: 'SEND_FOR_MDO_APPROVAL',
  //             applicationIds: [component.batchData.batchId],
  //             limit: 100,
  //             offset: 0,
  //             deptName: component.userProfile.rootOrg.orgName,
  //         }
  //         component.getNewRequestsList()

  //         expect(bpService.getRequests).toHaveBeenCalledWith(request)
  //         expect(bpService.getLearnersWithoutOrg).toHaveBeenCalled()
  //     })

  //     // it('should set newUsers, clonedNewUsers, and sort newUsers by lastUpdatedOn date', () => {
  //     //     const mockResponse = {
  //     //         result: {
  //     //             data: [
  //     //                 { wfInfo: [{ lastUpdatedOn: '2022-01-01T10:00:00Z' }] },
  //     //                 { wfInfo: [{ lastUpdatedOn: '2022-01-01T08:00:00Z' }] },
  //     //             ],
  //     //         },
  //     //     };

  //     //     (bpService.getRequests as jest.Mock).mockReturnValue(of(mockResponse))

  //     //     component.getNewRequestsList()

  //     //     expect(component.newUsers).toEqual([
  //     //         { wfInfo: [{ lastUpdatedOn: '2022-01-01T08:00:00Z' }] },
  //     //         { wfInfo: [{ lastUpdatedOn: '2022-01-01T10:00:00Z' }] },
  //     //     ])

  //     //     expect(component.clonedNewUsers).toEqual(mockResponse.result.data)
  //     // })

  //     // it('should call getAllLearner', () => {
  //     //     (bpService.getRequests as jest.Mock).mockReturnValue(of({ result: { data: [] } }))

  //     //     component.getNewRequestsList()

  //     //     expect(component.getAllLearner).toHaveBeenCalled()
  //     // })

  // })

  // describe('getSessionDetails', () => {
  //     it('should set sessionDetails from batchData', () => {
  //         const mockBatchData = {
  //             batchAttributes: {
  //                 sessionDetails_v2: [
  //                     { sessionId: 'session1', sessionName: 'Session One' },
  //                     { sessionId: 'session2', sessionName: 'Session Two' }
  //                 ]
  //             }
  //         }

  //         component.batchData = mockBatchData // Set the mock batchData
  //         component.getSessionDetails() // Call the method

  //         // Assert that sessionDetails is set correctly
  //         expect(component.sessionDetails).toEqual(mockBatchData.batchAttributes.sessionDetails_v2)
  //     })
  // })

  // describe('getApprovalStatusList', () => {
  //     beforeEach(() => {
  //         component.batchData = { batchId: 'testBatchId' }
  //         component.userProfile = { rootOrg: { orgName: 'testOrg' } }

  //         // Mock getActionType function
  //         jest.spyOn(component, 'getActionType').mockImplementation()
  //     })

  //     it('should call getSerchRequests with the correct request object', () => {
  //         const expectedRequest = {
  //             serviceName: ['blendedprogram'],
  //             applicationStatus: ['SEND_FOR_PC_APPROVAL', 'SEND_FOR_MDO_APPROVAL', 'REJECTED', 'REMOVED'],
  //             applicationIds: ['testBatchId'],
  //             limit: 100,
  //             offset: 0,
  //             deptName: ['testOrg'],
  //         };

  //         (bpService.getSerchRequests as jest.Mock).mockReturnValue(of({ result: { data: [] } }))

  //         component.getApprovalStatusList()

  //         expect(bpService.getSerchRequests).toHaveBeenCalledWith(expectedRequest)
  //     })

  //     it('should set approvalStatus and clonedApprovalStatusUsers from response', () => {
  //         const mockResponse = {
  //             result: {
  //                 data: [
  //                     { status: 'SEND_FOR_PC_APPROVAL' },
  //                     { status: 'SEND_FOR_MDO_APPROVAL' }
  //                 ]
  //             }
  //         };

  //         (bpService.getSerchRequests as jest.Mock).mockReturnValue(of(mockResponse))

  //         component.getApprovalStatusList()

  //         expect(component.approvalStatus).toEqual(mockResponse.result.data)
  //         expect(component.clonedApprovalStatusUsers).toEqual(mockResponse.result.data)
  //     })

  //     it('should call getActionType after setting approval status', () => {
  //         (bpService.getSerchRequests as jest.Mock).mockReturnValue(of({ result: { data: [] } }))

  //         component.getApprovalStatusList()

  //         expect(component.getActionType).toHaveBeenCalled()
  //     })
  // })

  // describe('getRejectedList', () => {
  //     it('should call getRequests with the correct request object', () => {
  //         const expectedRequest = {
  //             serviceName: 'blendedprogram',
  //             applicationStatus: 'REJECTED',
  //             applicationIds: ['testBatchId'],
  //             limit: 100,
  //             offset: 0,
  //             deptName: 'testOrg',
  //         };

  //         (bpService.getRequests as jest.Mock).mockReturnValue(of({ result: { data: [] } }))

  //         component.getRejectedList()

  //         expect(bpService.getRequests).toHaveBeenCalledWith(expectedRequest)
  //     })

  //     it('should set rejectedUsers and clonedRejectedUsers from response', () => {
  //         const mockResponse = {
  //             result: {
  //                 data: [
  //                     { userId: 'user1', status: 'REJECTED' },
  //                     { userId: 'user2', status: 'REJECTED' }
  //                 ]
  //             }
  //         };

  //         (bpService.getRequests as jest.Mock).mockReturnValue(of(mockResponse))

  //         component.getRejectedList()

  //         expect(component.rejectedUsers).toEqual(mockResponse.result.data)
  //         expect(component.clonedRejectedUsers).toEqual(mockResponse.result.data)
  //     })
  // })
  // describe('getAllLearner', () => {

  //     beforeEach(() => {

  //     })
  //     it('should call getLearnersWithoutOrg with the correct batchId', () => {
  //         component.batchData = { batchId: 'testBatchId' }
  //         //(bpService.getLearnersWithoutOrg as jest.Mock).mockReturnValue(of([]))

  //         component.getAllLearner()

  //         expect(bpService.getLearnersWithoutOrg).toHaveBeenCalledWith('testBatchId')
  //     })

  //     it('should set learnerCount when response has learners', () => {
  //         const mockResponse = [{ learnerId: 'learner1' }, { learnerId: 'learner2' }];

  //         (bpService.getLearnersWithoutOrg as jest.Mock).mockReturnValue(of(mockResponse))

  //         component.getAllLearner()

  //         expect(component.learnerCount).toBe(mockResponse.length)
  //     })

  //     it('should not set learnerCount when response is empty', () => {
  //         (bpService.getLearnersWithoutOrg as jest.Mock).mockReturnValue(of([]))

  //         component.getAllLearner()

  //         expect(component.learnerCount).toBeUndefined()
  //     })
  // })


  describe('getUsersCount', () => {
    it('should set userscount with totalApplied when bpService returns data', async () => {
      component.batchData = { batchId: '123' }
      const mockResponse = {
        result: {
          data: [{}, {}, {}], // Mocking 3 users returned
        },
      };
      (bpService.getSerchRequests as jest.Mock).mockReturnValue(of(mockResponse))
      const result = await component.getUsersCount()
      expect(result).toEqual({
        enrolled: 0,
        totalApplied: 3,
        rejected: 0,
      })
      expect(bpService.getSerchRequests).toHaveBeenCalled()
    })

    it('should set userscount with totalApplied as 0 when bpService returns no data', async () => {
      component.batchData = { batchId: '123' }
      const mockResponse = {
        result: {
          data: []
        },
      };
      (bpService.getSerchRequests as jest.Mock).mockReturnValue(of(mockResponse))
      const result = await component.getUsersCount()
      expect(result).toEqual({
        enrolled: 0,
        totalApplied: 0,
        rejected: 0,
      })
      expect(bpService.getSerchRequests).toHaveBeenCalled()
    })

    it('should skip bpService call if batchId is not present', async () => {
      component.batchData = {}
      const result = await component.getUsersCount()
      expect(result).toBeUndefined()
      expect(bpService.getSerchRequests).not.toHaveBeenCalled()
    })
  })

  describe('clickOnBack() ', () => {
    it('should call when event is true', () => {
      const event = true
      component.clickOnBack(event)
      expect(component.showUserDetails).toBeFalsy()
      expect(component.selectedUser).toBeNull()
    })
    it('should not call clickOnBack()', () => {
      const event = false
      component.clickOnBack(event)
      expect(component.showUserDetails).toBeFalsy()
      expect(component.selectedUser).toBeNull()

    })
  })

  describe('onShowUser() ', () => {
    it('set showUserDetails is true', () => {
      const user = { name: "test", id: "12" }
      component.onShowUser(user)
      expect(component.showUserDetails).toBeTruthy()
      expect(component.selectedUser).toBe(user)
    })
  })

  describe('showLearners() ', () => {
    it('should return the learnrscount/currentBatchSize', () => {
      component.learnerCount = 10
      component.batchData = {
        id: 1,
        batchAttributes: {
          currentBatchSize: 20
        }
      }
      const result = component.showLearners()
      expect(result).toBe('10/20')
    })

    it('should return the learnrscount', () => {
      component.learnerCount = 10
      component.batchData = undefined
      const result = component.showLearners()
      expect(result).toBe(10)
    })
  })

  describe('filterNewUsers()', () => {
    it('should filter new users based on first name or department name', () => {
      const searchText = 'John'
      const users = [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
        {
          userInfo: { first_name: 'Alice' },
          wfInfo: [{ deptName: 'Finance' }],
        },
      ]
      component.newUsers = users
      component.clonedNewUsers = [...users]
      component.filterNewUsers(searchText)

      expect(component.newUsers.length).toBe(1)
      expect(component.newUsers[0].userInfo.first_name).toBe('John')
    })

    it('should reset newUsers to clonedNewUsers if searchText is empty', () => {
      const users = [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
      ]
      component.newUsers = users
      component.clonedNewUsers = [...users]
      component.filterNewUsers('')

      expect(component.newUsers.length).toBe(2)
    })
  })

  describe('filterApprovedUsers()', () => {
    it('should filter approved users based on first name or department name', () => {
      const searchText = 'John'
      const users = [
        {
          first_name: 'John',
          department: 'Engineering',
        },
        {
          first_name: 'Jane',
          department: 'Human Resources',
        },
        {
          first_name: 'Alice',
          department: 'Finance',
        },
      ]
      component.approvedUsers = users
      component.clonedApprovedUsers = [...users]
      component.filterApprovedUsers(searchText)

      expect(component.approvedUsers.length).toBe(1)
      expect(component.approvedUsers[0].first_name).toBe('John')
      expect(component.approvedUsers[0].department).toBe('Engineering')
    })

    it('should reset  aprroved users to clonedApprovedUsers if searchText is empty', () => {
      const users = [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
      ]
      component.approvedUsers = users
      component.clonedApprovedUsers = [...users]
      component.filterApprovedUsers('')

      expect(component.newUsers.length).toBe(2)
    })
  })

  describe('filterRejectedUsers()', () => {
    it('should filter rejected users based on first name', () => {
      const searchText = 'John'
      const users = [
        {
          userInfo: { first_name: 'John' },
        },
        {
          userInfo: { first_name: 'Jane' },
        },
        {
          userInfo: { first_name: 'Alice' },
        },
      ]
      component.rejectedUsers = users
      component.clonedRejectedUsers = [...users]
      component.filterRejectedUsers(searchText)

      expect(component.rejectedUsers.length).toBe(1)
      expect(component.rejectedUsers[0].userInfo.first_name).toBe('John')
    })

    it('should reset rejected users to clonedRejectedUsers if searchText is empty', () => {
      const users = [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
      ]
      component.rejectedUsers = users
      component.clonedRejectedUsers = [...users]
      component.filterRejectedUsers('')

      expect(component.rejectedUsers.length).toBe(2)
    })
  })

  describe('filterApprovalStatusUsers()', () => {
    it('should filter approved users based on first name or department name', () => {
      const searchText = 'John'
      const users = [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
        {
          userInfo: { first_name: 'Alice' },
          wfInfo: [{ deptName: 'Finance' }],
        },
      ]
      component.clonedApprovalStatusUsers = users
      component.approvalStatus = [...users]
      component.filterApprovalStatusUsers(searchText)

      expect(component.approvalStatus.length).toBe(1)
      expect(component.approvalStatus[0].userInfo.first_name).toBe('John')
    })

    it('should reset newUsers to clonedApprovalStatusUsers if searchText is empty', () => {
      const users = [
        {
          userInfo: { first_name: 'John' },
          wfInfo: [{ deptName: 'Engineering' }],
        },
        {
          userInfo: { first_name: 'Jane' },
          wfInfo: [{ deptName: 'Human Resources' }],
        },
      ]
      component.clonedApprovalStatusUsers = users
      component.approvalStatus = [...users]
      component.filterApprovalStatusUsers('')

      expect(component.approvalStatus.length).toBe(2)
    })
  })

  describe('onSearchLearners()', () => {
    it('should call filterNewUsers when currentFilter is "pending"', () => {
      const searchText = 'Alice'
      component.currentFilter = 'pending'
      component.newUsers = [
        {
          userInfo: { first_name: 'Alice' },
          wfInfo: [{ deptName: 'Finance' }],
        },
      ]
      const filterNewUsersSpy = jest.spyOn(component, 'filterNewUsers')

      component.onSearchLearners(searchText)

      expect(filterNewUsersSpy).toHaveBeenCalledWith(searchText)
    })

    it('should call filterApprovedUsers when currentFilter is "approved"', () => {
      const searchText = 'Alice'
      component.currentFilter = 'approved'
      const filterApprovedUsersSpy = jest.spyOn(component, 'filterApprovedUsers')

      component.onSearchLearners(searchText)

      expect(filterApprovedUsersSpy).toHaveBeenCalledWith(searchText)
    })

    it('should call filterRejectedUsers when currentFilter is "rejected"', () => {
      const searchText = 'Alice'
      component.currentFilter = 'rejected'
      const filterRejectedUsersSpy = jest.spyOn(component, 'filterRejectedUsers')

      component.onSearchLearners(searchText)

      expect(filterRejectedUsersSpy).toHaveBeenCalledWith(searchText)
    })

    it('should call ; when currentFilter is "approvalStatus"', () => {
      const searchText = 'Alice'
      component.currentFilter = 'approvalStatus'
      const filterApprovalStatusUsersSpy = jest.spyOn(component, 'filterApprovalStatusUsers')

      component.onSearchLearners(searchText)

      expect(filterApprovalStatusUsersSpy).toHaveBeenCalledWith(searchText)
    })
  })

  describe('allowToNominate', () => {
    it('should return true if today is before the enrollmentEndDate', () => {
      component.batchData = { enrollmentEndDate: moment().add(1, 'days').format('YYYY-MM-DD') }
      expect(component.allowToNominate()).toBe(true)
    })

    it('should return true if today is the same as the enrollmentEndDate', () => {
      component.batchData = { enrollmentEndDate: moment().format('YYYY-MM-DD') }
      expect(component.allowToNominate()).toBe(true)
    })

    it('should return false if today is after the enrollmentEndDate', () => {
      component.batchData = { enrollmentEndDate: moment().subtract(1, 'days').format('YYYY-MM-DD') }
      expect(component.allowToNominate()).toBe(false)
    })
  })

  describe('removeLearner', () => {
    it('should return true if today is before the startDate', () => {
      const startDate = moment().add(1, 'days').format('YYYY-MM-DD')
      expect(component.removeLearner(startDate)).toBe(true)
    })

    it('should return false if today is the same as the startDate', () => {
      const startDate = moment().format('YYYY-MM-DD')
      expect(component.removeLearner(startDate)).toBe(false)
    })

    it('should return false if today is after the startDate', () => {
      const startDate = moment().subtract(1, 'days').format('YYYY-MM-DD')
      expect(component.removeLearner(startDate)).toBe(false)
    })
  })

  describe('requestMessages', () => {

    it('should return "Request is approved successfully!" for ONE_STEP_MDO', () => {
      component.programData = {
        wfApprovalType: NsContent.WFBlendedProgramApprovalTypes.ONE_STEP_MDO
      }
      expect(component.requestMesages()).toBe('Request is approved successfully!')
    })

    it('should return "Request is approved successfully!" for TWO_STEP_PC_MDO', () => {
      component.programData = {
        wfApprovalType: NsContent.WFBlendedProgramApprovalTypes.TWO_STEP_PC_MDO
      }
      expect(component.requestMesages()).toBe('Request is approved successfully!')
    })

    it('should return "Request is approved successfully! Further needs to be approved by program coordinator." for TWO_STEP_MDO_PC', () => {
      component.programData = {
        wfApprovalType: NsContent.WFBlendedProgramApprovalTypes.TWO_STEP_MDO_PC
      }
      expect(component.requestMesages()).toBe('Request is approved successfully! Further needs to be approved by program coordinator.')
    })

    it('should return "Request is approved successfully!" for any other type', () => {
      component.programData = {
        wfApprovalType: 'UNKNOWN_TYPE'
      }
      expect(component.requestMesages()).toBe('Request is approved successfully!')
    })
  })


  describe('getActionType', () => {
    it('should set approvalAction to rejectedByMdo for REJECTED status with MDO_ADMIN role', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'REJECTED',
              modificationHistory: JSON.stringify([{ action: 'REJECT', role: 'MDO_ADMIN' }]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBe('rejectedByMdo')
    })

    it('should set approvalAction to rejectedByPc for REJECTED status with PROGRAM_COORDINATOR role', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'REJECTED',
              modificationHistory: JSON.stringify([{ action: 'REJECT', role: 'PROGRAM_COORDINATOR' }]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBe('rejectedByPc')
    })

    it('should set approvalAction to pendingForMdo for SEND_FOR_MDO_APPROVAL status', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'SEND_FOR_MDO_APPROVAL',
              modificationHistory: JSON.stringify([]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBe('pendingForMdo')
    })

    it('should set approvalAction to pendingForPc for SEND_FOR_PC_APPROVAL status', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'SEND_FOR_PC_APPROVAL',
              modificationHistory: JSON.stringify([]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBe('pendingForPc')
    })

    it('should set approvalAction to removeByMdo for REMOVED status with MDO_ADMIN role', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'REMOVED',
              modificationHistory: JSON.stringify([{ action: 'REMOVE', role: 'MDO_ADMIN' }]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBe('removeByMdo')
    })

    it('should set approvalAction to removeByPc for REMOVED status with PROGRAM_COORDINATOR role', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'REMOVED',
              modificationHistory: JSON.stringify([{ action: 'REMOVE', role: 'PROGRAM_COORDINATOR' }]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBe('removeByPc')
    })

    it('should not set approvalAction for unrecognized status', () => {
      component.approvalStatus = [
        {
          wfInfo: [
            {
              currentStatus: 'UNKNOWN_STATUS',
              modificationHistory: JSON.stringify([]),
              lastUpdatedOn: new Date(),
            }
          ],
        },
      ]
      component.getActionType()
      expect(component.approvalStatus[0].approvalAction).toBeUndefined()
    })
  })
})