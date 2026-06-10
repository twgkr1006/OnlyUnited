const prisma = require('../prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
    try {
        const {
            user_email,
            user_pw,
            user_name,
            user_nickname,
            user_gender,
            user_birthday,
            user_phone
        } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { user_email } });
        if (existingUser) {
            return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
        }

        const hashedPw = await bcrypt.hash(user_pw, 10);

        const newUser = await prisma.user.create({
            data: {
                user_email,
                user_pw: hashedPw,
                user_name,
                user_nickname,
                user_gender,
                user_birthday: new Date(user_birthday),
                user_phone,
                user_role: 'USER',
                user_tier: 'SEMIPRO',
                user_social: 'None',
                user_status: 'ACTIVE',
            },
        });

        res.status(201).json({ message: 'signup success', user: newUser });
    } catch (err) {
        console.error('❗회원가입 실패:', err);
        res.status(500).json({ message: 'signup failed', error: err.message });
    }
};

const login = async (req, res) => {
    const { user_email, user_pw } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { user_email } });

        if (!user || !(await bcrypt.compare(user_pw, user.user_pw))) {
            return res.status(400).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, user_email: user.user_email },
            process.env.JWT_SECRET || 'default-jwt-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        const { user_pw: _, ...userWithoutPw } = user;
        return res.status(200).json({ message: '로그인 성공', token, user: userWithoutPw });
    } catch (err) {
        console.error('❌ 로그인 실패:', err);
        res.status(500).json({ message: 'login failed' });
    }
};

const getMe = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-jwt-secret');
        const user = await prisma.user.findUnique({ where: { user_id: decoded.user_id } });
        if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

        const { user_pw: _, ...userWithoutPw } = user;
        return res.status(200).json({ user: userWithoutPw });
    } catch {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

const updateUserInfo = async (req, res) => {
    try {
        const { user_id, user_phone, user_gender, user_birthday } = req.body;

        const updatedUser = await prisma.user.update({
            where: { user_id },
            data: {
                user_phone,
                user_gender,
                user_birthday: new Date(user_birthday),
            },
        });

        res.status(200).json({ message: 'User updated', user: updatedUser });
    } catch (err) {
        console.error('❌ 추가 정보 업데이트 실패:', err);
        res.status(500).json({ message: 'Failed to update user info' });
    }
};

module.exports = { signup, login, getMe, updateUserInfo };
