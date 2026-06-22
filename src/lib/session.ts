import { auth } from './auth'

export async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id || null
}

export async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function requireAdmin(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    throw new Error('Admin access required')
  }
  return session.user.id
}
