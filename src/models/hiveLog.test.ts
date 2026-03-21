import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import {
  addHiveLog,
  addManualHiveLogEntry,
  deleteHiveLogEntry,
  formatHiveLogAction,
  hiveLogActions,
  listHiveLogs,
  syncHiveLineageLogs,
  syncHiveLogsFromBackend,
  updateHiveLogEntry,
} from './hiveLog'
import { db } from './db'
import { getShareToken, getToken } from '@/user'

vi.mock('./db', () => {
  const mockWhere = vi.fn()
  const mockReverse = vi.fn()
  const mockSortBy = vi.fn()
  const mockFirst = vi.fn()
  const mockDeleteByWhere = vi.fn()
  const mockAdd = vi.fn()
  const mockPut = vi.fn()
  const mockDelete = vi.fn()
  const mockUpdate = vi.fn()
  const mockBulkPut = vi.fn()
  const mockTransaction = vi.fn(async (_mode: string, _table: unknown, cb: () => Promise<void>) => {
    await cb()
  })

  mockReverse.mockReturnValue({ sortBy: mockSortBy })
  mockWhere.mockImplementation(() => ({
    reverse: mockReverse,
    first: mockFirst,
    delete: mockDeleteByWhere,
  }))

  return {
    db: {
      hive_log: {
        where: mockWhere,
        add: mockAdd,
        put: mockPut,
        delete: mockDelete,
        update: mockUpdate,
        bulkPut: mockBulkPut,
      },
      transaction: mockTransaction,
      __mocks: {
        mockWhere,
        mockReverse,
        mockSortBy,
        mockFirst,
        mockDeleteByWhere,
        mockAdd,
        mockPut,
        mockDelete,
        mockUpdate,
        mockBulkPut,
        mockTransaction,
      },
    },
  }
})

vi.mock('@/uri', () => ({
  gatewayUri: vi.fn(() => 'https://api.example.test/graphql'),
}))

vi.mock('@/user', () => ({
  getToken: vi.fn(),
  getShareToken: vi.fn(),
}))

const dbMocks = (db as any).__mocks as {
  mockWhere: Mock
  mockReverse: Mock
  mockSortBy: Mock
  mockFirst: Mock
  mockDeleteByWhere: Mock
  mockAdd: Mock
  mockPut: Mock
  mockDelete: Mock
  mockUpdate: Mock
  mockBulkPut: Mock
  mockTransaction: Mock
}

const mockGetToken = getToken as Mock
const mockGetShareToken = getShareToken as Mock

describe('Hive Log Model', () => {
  beforeEach(() => {
    dbMocks.mockWhere.mockReset()
    dbMocks.mockReverse.mockReset()
    dbMocks.mockSortBy.mockReset()
    dbMocks.mockFirst.mockReset()
    dbMocks.mockDeleteByWhere.mockReset()
    dbMocks.mockAdd.mockReset()
    dbMocks.mockPut.mockReset()
    dbMocks.mockDelete.mockReset()
    dbMocks.mockUpdate.mockReset()
    dbMocks.mockBulkPut.mockReset()
    dbMocks.mockTransaction.mockReset()

    dbMocks.mockReverse.mockReturnValue({ sortBy: dbMocks.mockSortBy })
    dbMocks.mockWhere.mockImplementation(() => ({
      reverse: dbMocks.mockReverse,
      first: dbMocks.mockFirst,
      delete: dbMocks.mockDeleteByWhere,
    }))
    dbMocks.mockTransaction.mockImplementation(
      async (_mode: string, _table: unknown, cb: () => Promise<void>) => {
        await cb()
      }
    )

    dbMocks.mockSortBy.mockResolvedValue([])
    dbMocks.mockFirst.mockResolvedValue(undefined)
    dbMocks.mockAdd.mockResolvedValue(1)
    dbMocks.mockDelete.mockResolvedValue(undefined)
    dbMocks.mockUpdate.mockResolvedValue(undefined)
    dbMocks.mockBulkPut.mockResolvedValue(undefined)
    dbMocks.mockDeleteByWhere.mockResolvedValue(undefined)

    mockGetToken.mockReset()
    mockGetShareToken.mockReset()
    mockGetToken.mockReturnValue('token-1')
    mockGetShareToken.mockReturnValue('share-1')

    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('listHiveLogs should return [] for invalid hiveId', async () => {
    const result = await listHiveLogs(0)
    expect(result).toEqual([])
    expect(dbMocks.mockWhere).not.toHaveBeenCalled()
  })

  it('listHiveLogs should return sorted logs and enforce limit', async () => {
    dbMocks.mockSortBy.mockResolvedValue([
      { id: 1, hiveId: 5, title: 'a', action: hiveLogActions.NOTE, createdAt: '1' },
      { id: 2, hiveId: 5, title: 'b', action: hiveLogActions.NOTE, createdAt: '2' },
      { id: 3, hiveId: 5, title: 'c', action: hiveLogActions.NOTE, createdAt: '3' },
    ])

    const result = await listHiveLogs(5, 2)
    expect(result).toHaveLength(2)
    expect(result.map((row) => row.id)).toEqual([1, 2])
    expect(dbMocks.mockWhere).toHaveBeenCalledWith({ hiveId: 5 })
    expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1)
    expect(dbMocks.mockSortBy).toHaveBeenCalledWith('createdAt')
  })

  it('syncHiveLogsFromBackend should replace local logs with backend rows', async () => {
    ;(fetch as Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            hiveLogs: [
              {
                id: '11',
                hiveId: '5',
                action: hiveLogActions.INSPECTION,
                title: 'Inspected',
                details: 'ok',
                source: 'user',
                dedupeKey: 'k1',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                relatedHives: [{ id: '9', hiveNumber: 42 }],
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    await syncHiveLogsFromBackend(5, 30)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(dbMocks.mockTransaction).toHaveBeenCalledTimes(1)
    expect(dbMocks.mockWhere).toHaveBeenCalledWith({ hiveId: 5 })
    expect(dbMocks.mockDeleteByWhere).toHaveBeenCalledTimes(1)
    expect(dbMocks.mockBulkPut).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 11,
        hiveId: 5,
        relatedHives: [{ id: 9, hiveNumber: 42 }],
      }),
    ])
  })

  it('addHiveLog should validate input and return undefined for invalid payload', async () => {
    const result = await addHiveLog({
      hiveId: 0,
      action: hiveLogActions.NOTE,
      title: ' ',
    })

    expect(result).toBeUndefined()
    expect(dbMocks.mockAdd).not.toHaveBeenCalled()
  })

  it('addHiveLog should return existing id when dedupe key already exists', async () => {
    dbMocks.mockFirst.mockResolvedValue({ id: 99 })

    const result = await addHiveLog({
      hiveId: 5,
      action: hiveLogActions.NOTE,
      title: 'Existing',
      dedupeKey: 'dupe-key',
    })

    expect(result).toBe(99)
    expect(dbMocks.mockAdd).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('addHiveLog should persist local entry and replace with backend entry on success', async () => {
    dbMocks.mockAdd.mockResolvedValue(7)
    ;(fetch as Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            addHiveLog: {
              id: '101',
              hiveId: '5',
              action: hiveLogActions.NOTE,
              title: 'Trim me',
              details: 'detail',
              source: 'system',
              dedupeKey: 'dk',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
              relatedHives: [{ id: '12', hiveNumber: 100 }],
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const result = await addHiveLog({
      hiveId: 5,
      action: hiveLogActions.NOTE,
      title: '  Trim me  ',
      details: ' detail ',
      dedupeKey: 'dk',
      relatedHives: [{ id: 12, hiveNumber: 100 }],
    })

    expect(result).toBe(101)
    expect(dbMocks.mockDelete).toHaveBeenCalledWith(7)
    expect(dbMocks.mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        hiveId: 5,
        title: 'Trim me',
        details: 'detail',
      })
    )
  })

  it('addHiveLog should keep local id when backend request fails', async () => {
    dbMocks.mockAdd.mockResolvedValue(8)
    ;(fetch as Mock).mockRejectedValue(new Error('network failed'))

    const result = await addHiveLog({
      hiveId: 5,
      action: hiveLogActions.NOTE,
      title: 'offline',
    })

    expect(result).toBe(8)
    expect(dbMocks.mockPut).not.toHaveBeenCalled()
  })

  it('addManualHiveLogEntry should trim and create NOTE user entry', async () => {
    dbMocks.mockAdd.mockResolvedValue(21)
    ;(fetch as Mock).mockRejectedValue(new Error('network failed'))

    const result = await addManualHiveLogEntry(5, '  manual note  ')

    expect(result).toBe(21)
    expect(dbMocks.mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        hiveId: 5,
        action: hiveLogActions.NOTE,
        title: 'manual note',
        source: 'user',
      })
    )
  })

  it('updateHiveLogEntry should no-op for invalid id', async () => {
    await updateHiveLogEntry(0, { title: 'x' })
    expect(dbMocks.mockUpdate).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('updateHiveLogEntry should update local DB and call backend mutation', async () => {
    ;(fetch as Mock).mockResolvedValue(
      new Response(JSON.stringify({ data: { updateHiveLog: { id: '5' } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await updateHiveLogEntry(5, { title: '  new title ', details: ' detail ' })

    expect(dbMocks.mockUpdate).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        title: 'new title',
        details: 'detail',
        updatedAt: expect.any(String),
      })
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('deleteHiveLogEntry should no-op for invalid id', async () => {
    await deleteHiveLogEntry(-1)
    expect(dbMocks.mockDelete).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('deleteHiveLogEntry should delete local record and call backend mutation', async () => {
    ;(fetch as Mock).mockResolvedValue(
      new Response(JSON.stringify({ data: { deleteHiveLog: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await deleteHiveLogEntry(15)

    expect(dbMocks.mockDelete).toHaveBeenCalledWith(15)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('formatHiveLogAction should return expected labels and fallback', () => {
    expect(formatHiveLogAction(hiveLogActions.STRUCTURE_ADD)).toBe('Structure added')
    expect(formatHiveLogAction(hiveLogActions.LOCATION_MOVE)).toBe('Location changed')
    expect(formatHiveLogAction('UNKNOWN' as any)).toBe('Event')
  })

  it('syncHiveLineageLogs should create lineage entries for merge relations', async () => {
    dbMocks.mockAdd
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
    ;(fetch as Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            addHiveLog: {
              id: '100',
              hiveId: '5',
              action: hiveLogActions.LINEAGE,
              title: 'x',
              details: '',
              source: 'system',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    await syncHiveLineageLogs({
      id: 5,
      mergeDate: '2026-01-10',
      mergedIntoHive: { id: 10, hiveNumber: 1000 },
      mergedFromHives: [
        { id: 11, hiveNumber: 1001, mergeDate: '2026-01-08' },
        { id: 12, hiveNumber: 1002, mergeDate: '2026-01-09' },
      ],
    })

    expect(dbMocks.mockAdd).toHaveBeenCalledTimes(3)
    const payloads = dbMocks.mockAdd.mock.calls.map((call) => call[0])
    expect(payloads.every((row) => row.action === hiveLogActions.LINEAGE)).toBe(true)
  })
})
