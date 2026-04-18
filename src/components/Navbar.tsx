
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap" rel="stylesheet"></link>
interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Notices', path: '/notice' },
    { name: 'Life Guide', path: '/info' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Academic Archives', path: '/material' },
    { name: 'About', path: '/about' },
  ];

  const canAccessAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.STAFF || user.email === 'admin@admin.com');

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-extrabold tracking-tight duration-300 drop-shadow-sm"
              style={{ fontFamily: '"Nunito", sans-serif', borderRadius: '20px' }}>
              SKAI
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-[13px] font-bold transition-all ${isActive(item.path)
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-indigo-600'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                {canAccessAdmin && (
                  <Link to="/admin" className="text-[10px] font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg hover:bg-indigo-600 transition-colors">DASHBOARD</Link>
                )}
                <Link to="/mypage" className="text-sm font-bold text-slate-700 hover:text-indigo-600">My Page</Link>
                <button onClick={onLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">Sign Out</button>
              </div>
            ) : (
              <Link to="/login" className="px-5 py-2 rounded-full bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all shadow-md">
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-indigo-950 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t py-6 px-6 space-y-4 shadow-xl">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)} className="block text-base font-bold text-slate-900">{item.name}</Link>
          ))}
          <div className="pt-6 border-t flex flex-col space-y-3">
            {user ? (
              <>
                {canAccessAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-base font-black text-indigo-600">Admin Dashboard</Link>}
                <Link to="/mypage" onClick={() => setIsMenuOpen(false)} className="text-base font-bold">My Page</Link>
                <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold">Sign Out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-4 bg-indigo-600 text-white rounded-xl font-bold">Sign In</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
