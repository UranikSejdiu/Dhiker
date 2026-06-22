import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = getToday()

  await prisma.$executeRawUnsafe(
    `UPDATE dhikrs SET daily_count = 0, last_reset_date = ? WHERE user_id = ? AND last_reset_date != ?`,
    today,
    session.user.id,
    today
  )

  const dhikrs = await prisma.dhikr.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    dhikrs: dhikrs.map((d) => ({
      id: d.id,
      user_id: d.userId,
      name: d.name,
      total_count: Number(d.totalCount),
      daily_count: d.dailyCount,
      daily_limit: d.dailyLimit,
      last_reset_date:
        d.lastResetDate instanceof Date
          ? d.lastResetDate.toISOString().split('T')[0]
          : String(d.lastResetDate),
      created_at: d.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action, id, name, daily_limit, deltas, reset_total } = body

  if (action === 'sync') {
    return handleSync(session.user.id, deltas)
  }

  if (action === 'add') {
    if (!name) {
      return NextResponse.json({ error: 'Dhikr name is required.' }, { status: 400 })
    }

    const dhikrId = id || crypto.randomUUID()
    const today = getToday()

    const dhikr = await prisma.dhikr.create({
      data: {
        id: dhikrId,
        userId: session.user.id,
        name,
        totalCount: 0,
        dailyCount: 0,
        dailyLimit: daily_limit ?? null,
        lastResetDate: new Date(today),
      },
    })

    return NextResponse.json({
      success: true,
      dhikr: {
        id: dhikr.id,
        user_id: dhikr.userId,
        name: dhikr.name,
        total_count: Number(dhikr.totalCount),
        daily_count: dhikr.dailyCount,
        daily_limit: dhikr.dailyLimit,
        last_reset_date: today,
        created_at: dhikr.createdAt.toISOString(),
      },
    })
  }

  if (action === 'reset') {
    if (!id) {
      return NextResponse.json({ error: 'Dhikr ID is required.' }, { status: 400 })
    }

    const today = getToday()
    const data: any = { dailyCount: 0, lastResetDate: new Date(today) }
    if (reset_total) {
      data.totalCount = 0
    }

    await prisma.dhikr.updateMany({
      where: { id, userId: session.user.id },
      data,
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}

async function handleSync(userId: string, deltas: Record<string, number>) {
  if (!deltas || Object.keys(deltas).length === 0) {
    const dhikrs = await prisma.dhikr.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      success: true,
      dhikrs: dhikrs.map((d) => ({
        id: d.id,
        user_id: d.userId,
        name: d.name,
        total_count: Number(d.totalCount),
        daily_count: d.dailyCount,
        daily_limit: d.dailyLimit,
        last_reset_date:
          d.lastResetDate instanceof Date
            ? d.lastResetDate.toISOString().split('T')[0]
            : String(d.lastResetDate),
        created_at: d.createdAt.toISOString(),
      })),
    })
  }

  const today = getToday()
  const todayDate = new Date(today)

  await prisma.$transaction(
    Object.entries(deltas).map(([id, delta]) => {
      const d = Number(delta)
      if (d === 0) return prisma.$queryRawUnsafe('SELECT 1')

      return prisma.$executeRawUnsafe(
        `UPDATE dhikrs
         SET total_count = GREATEST(CAST(total_count AS SIGNED) + ?, 0),
             daily_count = GREATEST(
               CASE WHEN last_reset_date = ? THEN CAST(daily_count AS SIGNED) ELSE 0 END + ?,
               0
             ),
             last_reset_date = ?
         WHERE id = ? AND user_id = ?`,
        d,
        today,
        d,
        todayDate,
        id,
        userId
      )
    })
  )

  const dhikrs = await prisma.dhikr.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    dhikrs: dhikrs.map((d) => ({
      id: d.id,
      user_id: d.userId,
      name: d.name,
      total_count: Number(d.totalCount),
      daily_count: d.dailyCount,
      daily_limit: d.dailyLimit,
      last_reset_date:
        d.lastResetDate instanceof Date
          ? d.lastResetDate.toISOString().split('T')[0]
          : String(d.lastResetDate),
      created_at: d.createdAt.toISOString(),
    })),
  })
}
