import Logo from '../components/Logo';
import MatchesSection from '../components/MatchesSection';
import StandingSection from "../components/StandingSection";
import MainNews from "../components/MainNews";
import RecentPosts from "../components/RecentPosts";

const Home = () => {
    return (
        <div>
            {/* 홈 전용 로고 배너 */}
            <div className="pt-5 pb-3 flex justify-center bg-[#1c1c1c]">
                <Logo size="large" />
            </div>

            <div className="container mx-auto px-4 py-4">
                <div className="grid grid-cols-3 gap-5">
                    {/* 경기 섹션 - 2/3 너비 */}
                    <div className="col-span-2 bg-[#545454] rounded-xl p-4">
                        <MatchesSection />
                    </div>

                    {/* 순위 + 커뮤니티 - 1/3 너비 */}
                    <div className="col-span-1 flex flex-col gap-4">
                        <StandingSection />
                        <RecentPosts />
                    </div>

                    {/* 뉴스 섹션 - 전체 */}
                    <div className="col-span-3 bg-[#545454] rounded-xl p-4">
                        <MainNews />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
