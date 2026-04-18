
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-500 py-16 mt-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-white/5 pb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white text-2xl font-black mb-6 " style={{ fontFamily: '"Nunito", sans-serif'}} >SKAI</h3>



            <p className="text-sm leading-relaxed max-w-xs font-medium text-slate-400">
              Student Korean Association in Israel.<br />
              이스라엘 전역의 한국인 유학생들을 연결하고,<br />
              성공적인 정착과 학업을 지원합니다.
            </p>
          </div>
          <div>
            <h4 className="text-white text-[11px] font-black uppercase tracking-widest mb-6">Explore</h4>
            <ul className="space-y-3 text-xs font-bold">
              <li><Link to="/info" className="hover:text-white transition-colors">Life Guide</Link></li>
              <li><Link to="/material" className="hover:text-white transition-colors">Academic Archives</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About </Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[11px] font-black uppercase tracking-widest mb-6">Support</h4>
            <p className="text-xs font-bold mb-2">Email: hujikoreanstudentassociation@gmail.com</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <p>© 2026 SKAI. Together for a better student life.</p>
          <p className="mt-4 md:mt-0">Non-profit Organization</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
