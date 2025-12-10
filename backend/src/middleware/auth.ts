import { Context, Next } from 'hono'
import pkg from 'jsonwebtoken'
const { verify } = pkg

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
    userId: string
    username: string
    role: string
}

export const authMiddleware = async (c: Context, next: Next) => {
    try {
        const authHeader = c.req.header('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized - No token provided' }, 401)
        }

        const token = authHeader.substring(7)
        const decoded = verify(token, JWT_SECRET) as JWTPayload

        // Store user info in context
        c.set('user', decoded)

        await next()
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                return c.json({ error: 'Token expired' }, 401)
            }
            if (error.name === 'JsonWebTokenError') {
                return c.json({ error: 'Invalid token' }, 401)
            }
        }
        return c.json({ error: 'Authentication failed' }, 401)
    }
}

// Optional: Role-based middleware
export const requireRole = (allowedRoles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as JWTPayload | undefined

        if (!user || !allowedRoles.includes(user.role)) {
            return c.json({ error: 'Forbidden - Insufficient permissions' }, 403)
        }

        await next()
    }
}

