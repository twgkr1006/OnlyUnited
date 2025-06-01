const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const router = express.Router();

// 구글 로그인 요청
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 구글 로그인 콜백
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect('/');

        // 추가 정보 입력 필요 시
        if (!user.user_phone || user.user_phone === "000-0000-0000" || !user.user_gender) {
            return res.redirect(`http://localhost:5173/login?user_id=${user.user_id}&phone=${user.user_phone}`);
        }

        // 수동 로그인 처리
        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);

            const token = jwt.sign(
                { user_id: user.user_id, user_email: user.user_email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return res.redirect(`/login-success?token=${token}`);
        });
    })(req, res, next);
});

// 네이버 로그인 요청
router.get('/naver', passport.authenticate('naver'));

// 네이버 로그인 콜백
router.get('/naver/callback', (req, res, next) => {
    passport.authenticate('naver', async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect('/');

        if (!user.user_phone || user.user_phone === "000-0000-0000" || !user.user_gender) {
            return res.redirect(`http://localhost:5173/login?user_id=${user.user_id}&phone=${user.user_phone}`);
        }

        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);

            const token = jwt.sign(
                { user_id: user.user_id, user_email: user.user_email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return res.redirect(`/login-success?token=${token}`);
        });
    })(req, res, next);
});

// 카카오 로그인 요청
router.get('/kakao', passport.authenticate('kakao'));

// 카카오 로그인 콜백
router.get('/kakao/callback', (req, res, next) => {
    passport.authenticate('kakao', async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect('/');

        if (!user.user_phone || user.user_phone === "000-0000-0000" || !user.user_gender) {
            return res.redirect(`http://localhost:5173/login?user_id=${user.user_id}&phone=${user.user_phone}`);
        }

        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);

            const token = jwt.sign(
                { user_id: user.user_id, user_email: user.user_email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return res.redirect(`/login-success?token=${token}`);
        });
    })(req, res, next);
});

// 추가 정보 입력 API
router.patch('/complete-info', async (req, res) => {
    console.log('[요청 받은 데이터]', req.body);
    const { user_id, user_gender, user_birthday, user_phone } = req.body;

    try {
        const updated = await prisma.user.update({
            where: { user_id },
            data: {
                user_gender,
                user_birthday: new Date(user_birthday),
                user_phone
            }
        });

        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ error: '업데이트 실패', detail: err.message });
    }
});

// 로그아웃
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);

        req.session.destroy((err) => {
            if (err) return next(err);

            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
            });

            return res.status(200).send('✅ 로그아웃 완료');
        });
    });
});

module.exports = router;