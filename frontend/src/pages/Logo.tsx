import { Link } from 'react-router-dom';

const Logo = () => {
    return (
        <Link to="/" className="flex items-center gap-4 mb-6 no-underline hover:no-underline">
            <img src="/logo.png" alt="OnlyUnited Logo" className="w-32 h-32" />
            <div className="flex flex-col items-center leading-tight">
                <span className="text-5xl font-extrabold text-white">ONLY UNITED</span>
                <span className="text-sm text-gray-300">GLORY LIVES HERE, FOR YOU</span>
            </div>
        </Link>
    );
};

export default Logo;
