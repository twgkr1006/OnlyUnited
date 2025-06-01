import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import Signup from './Signup';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [userId, setUserId] = useState('');
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({
        user_phone: '',
        user_gender: 'MALE',
        user_birthday: ''
    });

    // 로그인 폼 상태
    const [loginForm, setLoginForm] = useState({
        user_email: '',
        user_pw: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // URL 파라미터 체크 및 소셜 로그인 처리
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('user_id');
        const phone = urlParams.get('phone');

        if (token) {
            // JWT 토큰이 있는 경우 - 정상적인 소셜 로그인
            localStorage.setItem('token', token);
            // axios 기본 설정에 토큰 추가
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // 홈페이지로 리다이렉션
            navigate('/');
        } else if (userId && phone === '000-0000-0000') {
            // 추가 정보가 필요한 경우
            setUserId(userId);
            setShowModal(true);
        }
    }, [navigate]);

    // 로그인 상태 체크
    useEffect(() => {
        axios.get('http://localhost:3001/api/user/me', {
            withCredentials: true
        })
        .then(res => {
            setUser(res.data.user);
            // 이미 로그인된 상태면 홈으로 리다이렉트
            navigate('/');
        })
        .catch(() => {
            setUser(null);
        });
    }, [navigate]);

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.target.name === 'user_phone') {
            const formattedValue = formatPhoneNumber(e.target.value);
            if (formattedValue.length <= 13) { // 010-1234-5678 형식의 최대 길이
                setForm({ ...form, user_phone: formattedValue });
            }
        } else {
            setForm({ ...form, [e.target.name]: e.target.value });
        }
    };

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
        setError(''); // 입력이 변경되면 에러 메시지 초기화
    };
    
    const handleSubmit = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/user/add-info', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // 토큰 추가
                },
                body: JSON.stringify({ user_id: userId, ...form }),
                credentials: 'include',
            });
            
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:3001/api/user/login', loginForm, {
                withCredentials: true
            });

            if (response.status === 200) {
                // 로그인 성공 후 사용자 정보 업데이트
                const userResponse = await axios.get('http://localhost:3001/api/user/me', {
                    withCredentials: true
                });
                setUser(userResponse.data.user);
                navigate('/');
            }
        } catch (err: any) {
            console.error('로그인 실패:', err);
            setError(err.response?.data?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 이미 로그인된 상태면 로그인 페이지 렌더링하지 않음
    if (user) {
        return null;
    }

    return (
    <>
        <div className="min-h-screen flex flex-col justify-center items-center">
            <Logo />
            <div className="w-80 flex flex-col gap-4">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {/* 이메일 입력 */}
                    <input
                        type="email"
                        name="user_email"
                        placeholder="이메일"
                        value={loginForm.user_email}
                        onChange={handleLoginChange}
                        required
                        className="w-full p-3 rounded bg-white/30 text-black border-none focus:outline-none focus:ring-0"
                    />
                    {/* 비밀번호 입력 */}
                    <input
                        type="password"
                        name="user_pw"
                        placeholder="비밀번호"
                        value={loginForm.user_pw}
                        onChange={handleLoginChange}
                        required
                        className="w-full p-3 rounded bg-white/30 text-black border-none focus:outline-none focus:ring-0"
                    />

                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}

                    {/* 로그인 버튼 */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 rounded bg-black text-white font-semibold disabled:opacity-50"
                    >
                        {loading ? '로그인 중...' : 'OnlyUnited 로그인'}
                    </button>
                </form>

                {/* 회원가입, 아이디 찾기, 비밀번호 찾기 */}
                <div className="flex justify-center gap-2 text-xs mt-2 text-white">
                    <button
                        type="button"
                        onClick={() => setShowSignupModal(true)}
                        className="hover:underline visited:text-white bg-transparent border-none p-0 m-0 cursor-pointer"
                    >회원가입</button>
                    <span className="text-gray-400">|</span>
                    <a href="/findid" className="hover:underline visited:text-white">ID찾기</a>
                    <span className="text-gray-400">|</span>
                    <a href="/findpw" className="hover:underline visited:text-white">비밀번호찾기</a>
                </div>

                {/* 소셜 로그인 */}
                <div className="flex flex-col gap-2">
                    <a href="http://localhost:3001/auth/google">
                        <button className="w-full p-3 text-black rounded bg-white hover:bg-gray-100 shadow relative flex items-center justify-center">
                            <img src="/google.png" alt="Google" className="absolute left-4 w-6 h-6" />
                            Google로 시작하기
                        </button>
                    </a>

                    <a href="http://localhost:3001/auth/kakao">
                        <button className="w-full p-3 text-black rounded bg-yellow-400 hover:bg-yellow-300 shadow relative flex items-center justify-center">
                            <img src="/kakao.svg" alt="Kakao" className="absolute left-4 w-6 h-6" />
                            Kakao로 시작하기
                        </button>
                    </a>
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
                        type="tel"
                        name="user_phone"
                        placeholder="전화번호"
                        value={form.user_phone}
                        onChange={handleChange}
                        className="w-full p-2 border mb-2"
                        maxLength={13}
                    />
                    <select 
                        name="user_gender" 
                        value={form.user_gender} 
                        onChange={handleChange}
                        className="w-full p-2 border mb-2"
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
        {/* 회원가입 모달 */}
        {showSignupModal && (
            <Signup onClose={() => setShowSignupModal(false)} />
        )}
    </>
    );
};

export default LoginPage;