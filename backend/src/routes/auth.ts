import { Hono } from 'hono'
import bcryptPkg from 'bcrypt'
const { hash, compare } = bcryptPkg
import jwtPkg from 'jsonwebtoken'
const { sign } = jwtPkg
import prisma from '../lib/prisma.js'
import { validateData, loginSchema, createUserSchema } from '../utils/validators.js'
import { authMiddleware, JWTPayload } from '../middleware/auth.js'

type Variables = {
    user: JWTPayload
}

const auth = new Hono<{ Variables: Variables }>()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Login
auth.post('/login', async (c) => {
    try {
        const body = await c.req.json()
        const { username, password } = validateData(loginSchema, body)

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return c.json({ error: 'Username atau password salah' }, 401)
        }

        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) {
            return c.json({ error: 'Username atau password salah' }, 401)
        }

        const token = sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as any
        )

        return c.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        })
    } catch (error: any) {
        return c.json({ error: error.message || 'Login gagal' }, 400)
    }
})

// Register (protected - admin only)
auth.post('/register', authMiddleware, async (c) => {
    try {
        const user = c.get('user')
        if (user.role !== 'admin') {
            return c.json({ error: 'Only admin can create users' }, 403)
        }

        const body = await c.req.json()
        const data = validateData(createUserSchema, body)

        const hashedPassword = await hash(data.password, 10)

        const newUser = await prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                name: data.name,
                role: data.role || 'kasir',
            },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
            },
        })

        return c.json(newUser, 201)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return c.json({ error: 'Username sudah digunakan' }, 400)
        }
        return c.json({ error: error.message || 'Registrasi gagal' }, 400)
    }
})

// Get current user
auth.get('/me', authMiddleware, async (c) => {
    try {
        const user = c.get('user')

        const currentUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
            },
        })

        return c.json(currentUser)
    } catch (error: any) {
        return c.json({ error: error.message || 'Failed to fetch user' }, 400)
    }
})

export default auth

