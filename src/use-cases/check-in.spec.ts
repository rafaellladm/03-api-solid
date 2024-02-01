import { InMemoryCheckInRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckInUseCase } from './check-in'
import { afterEach } from 'node:test'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'
import { Decimal } from '@prisma/client/runtime/library'

let checkInsRepository: InMemoryCheckInRepository
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('Check-in Use Case', () => {
  beforeEach(() => {
    checkInsRepository = new InMemoryCheckInRepository()
    gymsRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymsRepository)

    gymsRepository.items.push({
      id: 'gym-01',
      title: 'JavaScript Gym',
      description: '',
      phone: '',
      latitude: new Decimal(-4.1722371),
      longitude: new Decimal(-38.8623547),
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to check in', async () => {
    const { checkIn } = await sut.execute({
      gymId: 'gyn-01',
      userId: 'user-01',
      userLatitude: -4.1722371,
      userLongitude: -38.8623547,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in twice in the same day', async () => {
    vi.setSystemTime(new Date(2023, 0, 20, 8, 0, 0))

    await sut.execute({
      gymId: 'gyn-01',
      userId: 'user-01',
      userLatitude: -4.1722371,
      userLongitude: -38.8623547,
    })

    await expect(() =>
      sut.execute({
        gymId: 'gyn-01',
        userId: 'user-01',
        userLatitude: -4.1722371,
        userLongitude: -38.8623547,
      }),
    ).rejects.toBeInstanceOf(Error)
  })

  it('should be able to check in twice but in different day', async () => {
    vi.setSystemTime(new Date(2023, 0, 20, 8, 0, 0))

    await sut.execute({
      gymId: 'gyn-01',
      userId: 'user-01',
      userLatitude: -4.1722371,
      userLongitude: -38.8623547,
    })

    vi.setSystemTime(new Date(2023, 0, 21, 8, 0, 0))

    const { checkIn } = await sut.execute({
      gymId: 'gyn-01',
      userId: 'user-01',
      userLatitude: -4.1722371,
      userLongitude: -38.8623547,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in on distant gym', async () => {
    await gymsRepository.items.push({
      id: 'gym-02',
      title: 'JavaScript Gym',
      description: '',
      phone: '',
      latitude: new Decimal(-4.0470753),
      longitude: new Decimal(-38.713181),
    })

    await expect(() =>
      sut.execute({
        gymId: 'gyn-01',
        userId: 'user-01',
        userLatitude: -4.1722371,
        userLongitude: -38.8623547,
      }),
    ).rejects.toBeInstanceOf(Error)
  })
})
