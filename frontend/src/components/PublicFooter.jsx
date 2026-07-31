import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Globe } from 'lucide-react';

export default function PublicFooter({ lang }) {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">PathSync AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'vi' 
                ? 'Hệ thống hỗ trợ chuẩn bị hồ sơ du học thông minh, cá nhân hóa bằng AI.'
                : 'Smart, personalized study abroad application assistant powered by AI.'}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              {lang === 'vi' ? 'Sản phẩm' : 'Product'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => navigate('/features')} className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Tính năng' : 'Features'}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Trường học' : 'Universities'}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Học bổng' : 'Scholarships'}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Persona Lab' : 'Persona Lab'}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              {lang === 'vi' ? 'Công ty' : 'Company'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={() => navigate('/about')} className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Về chúng mình' : 'About Us'}
                </button>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Tuyển dụng' : 'Careers'}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Blog' : 'Blog'}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Liên hệ' : 'Contact'}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              {lang === 'vi' ? 'Hỗ trợ' : 'Support'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@pathsync.ai</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Hanoi, Vietnam</span>
              </li>
              <li className="pt-2">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Điều khoản sử dụng' : 'Terms of Service'}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  {lang === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy'}
                </a>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PathSync AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
