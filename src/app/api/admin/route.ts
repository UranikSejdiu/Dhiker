import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const totalUsers = await prisma.user.count()
  const totalDhikrs = await prisma.dhikr.count()

  const totalCountsResult = await prisma.dhikr.aggregate({
    _sum: { totalCount: true },
  })
  const totalCounts = Number(totalCountsResult._sum.totalCount || 0)

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      theme: true,
      language: true,
      createdAt: true,
      _count: { select: { dhikrs: true } },
    },
  })

  return NextResponse.json({
    total_users: totalUsers,
    total_dhikrs: totalDhikrs,
    total_counts: totalCounts,
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      display_name: u.displayName,
      role: u.role,
      theme: u.theme,
      language: u.language,
      created_at: u.createdAt.toISOString(),
      dhikr_count: u._count.dhikrs,
    })),
  })
}
