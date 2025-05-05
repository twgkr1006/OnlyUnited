import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const LoginPage: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [userId, setUserId] = useState('');
    const [form, setForm] = useState({
        user_phone: '',
        user_gender: 'MALE',
        user_birthday: ''
    });

    // /add-info?user_id=xxx 로 리디렉션된 경우 감지
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('user_id');
        const phone = params.get('phone');
    
        if (id) {
            setUserId(id);
            if (phone === '000-0000-0000') {
                setShowModal(true);
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async () => {
        try {
            const response = await fetch('http://localhost:3001/auth/complete-info', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, ...form }),
                credentials: 'include',
            });
            
            console.log('보낼 데이터:', { userId, ...form });
            if (!response.ok) {
                throw new Error('요청 실패: ' + response.status);
            }
        
            alert('✅ 추가 정보가 저장되었습니다.');
            setShowModal(false);
            window.location.href = '/';

            } catch (err) {
            console.error('[❌ Error]', err);
            alert('❌ 저장 실패: 서버 오류가 발생했습니다.');
            }
    };

    return (
    <>
        <div className="min-h-screen flex flex-col justify-center items-center">
        <Logo />
        <div className="w-80 flex flex-col gap-4">
            {/* 아이디 입력 */}
            <input
            type="text"
            placeholder="ID"
            className="w-full p-3 rounded bg-white/30 text-black border-none focus:outline-none focus:ring-0"
            />
            <input
            type="password"
            placeholder="PASSWORD"
            className="w-full p-3 rounded bg-white/30 text-black border-none focus:outline-none focus:ring-0"
            />

            {/* 로그인 버튼 */}
            <button className="w-full p-3 rounded bg-black text-white font-semibold">
            OnlyUnited 로그인
            </button>

            {/* 회원가입, 아이디 찾기, 비밀번호 찾기 */}
            <div className="flex justify-center gap-2 text-xs mt-2 text-white">
            <a href="/signin" className="hover:underline visited:text-white">회원가입</a>
            <span className="text-gray-400">|</span>
            <a href="/findid" className="hover:underline visited:text-white">ID찾기</a>
            <span className="text-gray-400">|</span>
            <a href="/findpw" className="hover:underline visited:text-white">비밀번호찾기</a>
            </div>

            {/* 소셜 로그인 */}
            <div className="flex flex-col gap-2 mt-6 font-semibold">
            <a href="http://localhost:3001/auth/google">
                <button className="w-full p-3 text-black rounded bg-white hover:bg-gray-100 shadow relative flex items-center justify-center">
                <img src="/google.png" alt="Google" className="absolute left-4 w-6 h-6" />
                Google로 시작하기
                </button>
            </a>

            <button className="w-full p-3 text-black rounded bg-yellow-400 hover:bg-yellow-300 shadow relative flex items-center justify-center">
                <img src="/kakao.svg" alt="Kakao" className="absolute left-4 w-6 h-6" />
                Kakao로 시작하기
            </button>
            
            <a href="http://localhost:3001/auth/naver">
                <button className="w-full p-3 text-white rounded bg-green-500 hover:bg-green-400 shadow relative flex items-center justify-center">
                    <img src="/naver.png" alt="Naver" className="absolute left-4 w-6 h-6" />
                    Naver로 시작하기
                </button>
            </a>
            </div>
        </div>

        <p className="text-xs mt-10">
            © OnlyUnited All Rights Reserved.
        </p>
        </div>

        {/* ✅ 추가 정보 모달 */}
        {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 text-black">
            <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-xl font-semibold mb-4 text-center">추가 정보 입력</h2>

            <input
                name="user_phone"
                placeholder="전화번호"
                value={form.user_phone}
                onChange={handleChange}
                className="w-full p-2 border mb-2"
            />
            <select 
                name="user_gender" 
                value={form.user_gender} 
                onChange={handleChange}
            >
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
            </select>
            <input
                name="user_birthday"
                type="date"
                value={form.user_birthday}
                onChange={handleChange}
                className="w-full p-2 border mb-4"
            />

            <button
                onClick={handleSubmit}
                className="w-full bg-black text-white p-2 rounded hover:bg-gray-800"
            >
                저장하기
            </button>
            </div>
        </div>
        )}
    </>
    );
};

export default LoginPage;