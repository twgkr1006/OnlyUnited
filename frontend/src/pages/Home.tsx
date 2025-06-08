import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Logo from '../components/Logo';
import NextMatchesSection from '../components/NextMatchesSection';
import StandingSection from "../components/StandingSection";

interface User {
    user_profile_image?: string;
    user_name?: string;
    user_email: string;
}

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        axios.get('http://localhost:3001/api/user/me', {
            withCredentials: true
        })
        .then(res => {
            setUser(res.data.user);
        })
        .catch(() => {
            setUser(null);
        });
    }, []);

    return (
        <div className="min-h-screen">
            {/* 로고 */}
            <div className="pt-6 pb-4 flex justify-center">
                <Logo size="large" />
            </div>

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-6">
                    {/* 경기 섹션 - 2/3 너비 */}
                    <div className="col-span-2 bg-[#545454] rounded-lg p-4">
                        <NextMatchesSection />
                    </div>

                    {/* 오른쪽 섹션 - 1/3 너비 */}
                    <div className="col-span-1 flex flex-col space-y-[10px]">
                        {/* 로그인/프로필 섹션 */}
                        <div className="bg-[#545454] rounded-lg p-6 flex flex-col items-center justify-center">
                            {user ? (
                                // 로그인된 경우
                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden">
                                        <img 
                                            src={user.user_profile_image || "/logo.png"} 
                                            alt="프로필" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white font-medium">{user.user_name || "사용자"}</h3>
                                        <p className="text-gray-400 text-sm">{user.user_email}</p>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="flex-1 px-4 py-2 bg-[#2e2d2d] text-white rounded-lg hover:bg-[#3e3d3d] transition-colors text-sm"
                                        >
                                            프로필
                                        </button>
                                        <button
                                            onClick={() => {
                                                axios.get('http://localhost:3001/auth/logout', { withCredentials: true })
                                                .then(() => {
                                                    setUser(null);
                                                    window.location.reload();
                                                })
                                                .catch(err => {
                                                    console.error('로그아웃 실패:', err);
                                                });
                                            }}
                                            className="flex-1 px-4 py-2 bg-[#2e2d2d] text-white rounded-lg hover:bg-[#3e3d3d] transition-colors text-sm"
                                        >
                                            로그아웃
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // 로그인되지 않은 경우
                                <>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full mb-8 px-6 py-3 bg-black rounded-lg text-white font-medium hover:bg-gray-100 hover:text-black transition-colors"
                                    >
                                        OnlyUnited 로그인
                                    </button>

                                    <div className="flex items-center gap-6 mb-4">
                                        <span className="text-white">소셜 로그인</span>
                                        <div className="flex gap-4">
                                            <a 
                                                href="http://localhost:3001/auth/google" 
                                                className="w-12 h-12 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                <img src="/google.png" alt="Google" className="w-6 h-6" />
                                            </a>
                                            <a 
                                                href="http://localhost:3001/auth/kakao" 
                                                className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:bg-[#FDD800] transition-colors"
                                            >
                                                <img src="/kakao.svg" alt="Kakao" className="w-6 h-6" />
                                            </a>
                                            <a 
                                                href="http://localhost:3001/auth/naver" 
                                                className="w-12 h-12 flex items-center justify-center bg-[#03C75A] rounded-full hover:bg-[#02B351] transition-colors"
                                            >
                                                <img src="/naver.png" alt="Naver" className="w-6 h-6" />
                                            </a>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-gray-300 hover:text-white transition-colors text-sm"
                                    >
                                        아직 OnlyUnited 회원이 아니신가요?
                                    </button>
                                </>
                            )}
                        </div>

                        {/* 순위 섹션 */}
                        <StandingSection />
                    </div>
                </div>
            </div>

            {/* 카피라이트 */}
            <div className="text-center text-gray-500 text-sm mt-8 pb-4">
                © OnlyUnited All Rights Reserved.
            </div>
        </div>
    );
};

export default Home;