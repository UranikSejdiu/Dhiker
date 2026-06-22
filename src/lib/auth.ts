import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          theme: user.theme,
          language: user.language,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'user'
        token.theme = (user as any).theme || 'dark-gold'
        token.language = (user as any).language || 'en'
      }
      if (account?.provider === 'google') {
        token.provider = 'google'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).theme = token.theme
        ;(session.user as any).language = token.language
        ;(session.user as any).provider = token.provider || 'credentials'
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email
        if (!email) return false

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, provider: true, password: true },
        })

        if (existing) {
          user.id = existing.id
        } else {
          const created = await prisma.user.create({
            data: {
              email,
              displayName: user.name || 'Google User',
              provider: 'google',
            },
          })
          user.id = created.id
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
