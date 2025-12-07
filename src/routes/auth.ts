import express from 'express';
import { databaseService } from '../services/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await databaseService.getUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const newUser = await databaseService.createUser({
            uid: uuidv4(),
            email,
            password, // ⚠️ 原型阶段直接存储，生产环境必须加密
            name: name || 'New User'
        });

        // Return user without password
        const { password: _, ...userSafe } = newUser;
        res.status(201).json(userSafe);
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await databaseService.getUserByEmail(email);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user without password
        const { password: _, ...userSafe } = user;
        res.json(userSafe);
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export { router };