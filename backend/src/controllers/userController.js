const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    try {
        const { user_email, user_pw, user_name } = req.body;

        const existingUser = await prisma.user.findUnique({
            where : { user_email },
        });

        if (existingUser) {
            return res.status(400).json({ message: '이미 존재하는 이메일입니다. '});
        }

        const newUser = await prisma.user.create({
            data: {
                user_email,
                user_pw,
                user_name,
                user_nickname: user_name,
                user_gender: 'MALE',
                user_birthday: new Date(),
                user_phone: '',
                user_role: 'USER',
                user_tier: 'AMATEUR',
                user_status: 'ACTIVE',
            },
        });

        res.status(201).json({ message: 'signup success', user: newUser});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'signup failed'});
    }
};

const login = async (req, res) => {
    try {
        const { user_email, user_pw } = req.body;

        const user = await prisma.user.findUnique({
            where : { user_email },
        });

        if (!user) {
            return res.status(400).json({ message: 'Email does not exist. '});
        }
        if (user.user_pw !== user_pw) {
            return res.status(400).json({ message: 'Password does not match. '});
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                user_email: user.user_email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN, 
            }
        );

        res.status(200).json({ message: 'success login', token});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'login failed'});
    }
};

module.exports = { signup, login };