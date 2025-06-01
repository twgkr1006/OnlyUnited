require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

passport.serializeUser((user, done) => {
    done(null, user.user_id); 
});

passport.deserializeUser(async (id, done) => {
    const user = await prisma.user.findUnique({ where: { user_id: id } });
    done(null, user);
});

// 구글
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    console.log('✅ 구글 프로필 수신 성공:', profile);
    const email = profile.emails[0].value;

    let user = await prisma.user.findUnique({ where: { user_email: email } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                user_email: email,
                user_name: profile.displayName,
                user_pw: 'GOOGLE_OAUTH',
                user_nickname: profile.displayName,
                user_gender: 'MALE',
                user_birthday: new Date('2000-01-01'),
                user_phone: '000-0000-0000',
                user_social: 'GOOGLE',
                user_role: 'USER',
                user_tier: 'AMATEUR',
                user_status: 'ACTIVE'
            }
        });
    }

    return done(null, user);
}));

// 네이버
passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/naver/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile._json.email;
        const gender = profile._json.gender === 'M' ? 'MALE' : 'FEMALE';
        const birthyear = profile._json.birthyear;
        const birthday = profile._json.birthday;
        const phone = profile._json.mobile;

        const fullBirthday = (birthyear && birthday)
            ? new Date(`${birthyear}-${birthday}`)
            : null;

        const name = profile._json.name || profile._json.nickname || '네이버유저';
        const nickname = profile._json.nickname || name;

        let user = await prisma.user.findUnique({ where: { user_email: email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    user_email: email,
                    user_gender: gender,
                    user_birthday: fullBirthday || new Date('2000-01-01'),
                    user_phone: phone || '000-0000-0000',
                    user_social: 'NAVER',
                    user_role: 'USER',
                    user_tier: 'AMATEUR',
                    user_status: 'ACTIVE',
                    user_pw: 'NAVER_OAUTH',
                    user_name: name,
                    user_nickname: nickname
                }
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// 카카오
passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: "http://localhost:3001/auth/kakao/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const nickname = profile.username || '카카오유저';
        const email = `${profile.id}@kakao.com`; // 👈 가짜 이메일

        let user = await prisma.user.findUnique({
            where: { user_email: email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    user_email: email,
                    user_gender: 'MALE',
                    user_birthday: new Date('2000-01-01'),
                    user_phone: '000-0000-0000',
                    user_social: 'KAKAO',
                    user_role: 'USER',
                    user_tier: 'AMATEUR',
                    user_status: 'ACTIVE',
                    user_pw: 'KAKAO_OAUTH',
                    user_name: nickname,
                    user_nickname: nickname
                }
            });
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));


module.exports = passport;