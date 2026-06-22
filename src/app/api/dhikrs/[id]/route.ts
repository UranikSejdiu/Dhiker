import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, daily_limit } = body

  if (!name) {
    return NextResponse.json(
      { error: 'Dhikr name is required.' },
      { status: 400 }
    )
  }

  await prisma.dhikr.updateMany({
    where: { id, userId: session.user.id },
    data: {
      name,
      dailyLimit: daily_limit ?? null,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await prisma.dhikr.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, reset_total } = body

  if (action === 'reset') {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const data: any = { dailyCount: 0, lastResetDate: new Date(todayStr) }
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
