import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Fingerprint, ShieldCheck, ArrowRight } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import { useAuth } from '../context/useAuth';

export default function FeaturesPage({ lang }) {
  const navigate = useNavigate();
  const { token, profile } = useAuth();

  const handleStart = () => {
    if (token) {
      if (profile && profile.onboarding_done) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/register');
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <main className="flex-1">
        {/* HERO */}
        <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 border-b bg-muted/20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              {lang === 'vi' ? 'Công cụ thực sự ' : 'Tools that make a real '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                {lang === 'vi' ? 'tạo nên khác biệt' : 'difference'}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              {lang === 'vi' 
                ? 'Mọi thứ bạn cần để nghiên cứu, lên kế hoạch và nộp hồ sơ du học thành công.' 
                : 'Everything you need to research, plan, and apply to study abroad successfully.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => scrollTo('explore')} className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 font-medium transition-colors">
                <Search className="w-4 h-4 mr-2" />
                {lang === 'vi' ? 'Khám phá' : 'Explore'}
              </button>
              <button onClick={() => scrollTo('applications')} className="inline-flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 px-6 py-2 font-medium transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                {lang === 'vi' ? 'Quản lý hồ sơ' : 'Applications'}
              </button>
              <button onClick={() => scrollTo('persona')} className="inline-flex items-center justify-center rounded-full bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 px-6 py-2 font-medium transition-colors">
                <Fingerprint className="w-4 h-4 mr-2" />
                Persona Lab
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES DETAIL */}
        <section className="py-24 container mx-auto px-4 space-y-32">
          {/* Feature 1 - Explore */}
          <div id="explore" className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 scroll-mt-24">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {lang === 'vi' ? 'Khám phá trường & học bổng' : 'Explore Schools & Scholarships'}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lang === 'vi' 
                  ? 'Công cụ tìm kiếm thông minh giúp bạn lọc qua hàng ngàn lựa chọn để tìm ra bến đỗ hoàn hảo nhất. Xem nhanh yêu cầu đầu vào, học phí và tỷ lệ đỗ dự kiến.' 
                  : 'Smart search tool helps you filter through thousands of options to find the perfect match. Quickly view admission requirements, tuition, and estimated acceptance rate.'}
              </p>
              <ul className="space-y-4">
                {(lang === 'vi' 
                  ? ['Thông tin cập nhật liên tục', 'Đánh giá tỷ lệ đỗ bằng AI', 'So sánh học phí & sinh hoạt phí']
                  : ['Always up-to-date information', 'AI-powered acceptance rate', 'Compare tuition & living costs']
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
                <img src="/explore_feature.jpg" alt="Explore Universities" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

          {/* Feature 2 - Applications */}
          <div id="applications" className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20 scroll-mt-24">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl">
                <FileText className="h-8 w-8 text-indigo-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {lang === 'vi' ? 'Quản lý tiến độ nộp hồ sơ' : 'Application Tracking'}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lang === 'vi' 
                  ? 'Theo dõi sát sao từng bước trong quá trình nộp đơn. Nhận nhắc nhở deadline và quản lý tài liệu cho từng trường một cách có hệ thống.' 
                  : 'Keep close track of every step in the application process. Get deadline reminders and systematically manage documents for each school.'}
              </p>
              <ul className="space-y-4">
                {(lang === 'vi' 
                  ? ['Kanban board trực quan', 'Cảnh báo deadline', 'Quản lý tài liệu tập trung']
                  : ['Visual Kanban board', 'Deadline alerts', 'Centralized document management']
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
                <img src="/applications_feature.jpg" alt="Application Tracking" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

          {/* Feature 3 - Persona Lab */}
          <div id="persona" className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 scroll-mt-24">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-xl">
                <Fingerprint className="h-8 w-8 text-purple-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Persona Lab & Essay Copilot
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lang === 'vi' 
                  ? 'Công nghệ AI độc quyền giúp bạn xây dựng hình ảnh cá nhân (Persona) nhất quán và hỗ trợ viết bài luận (SOP) chân thật, mang đậm dấu ấn riêng.' 
                  : 'Proprietary AI technology helps you build a consistent Persona and supports writing authentic, personalized essays (SOP).'}
              </p>
              <ul className="space-y-4">
                {(lang === 'vi' 
                  ? ['Phân tích điểm mạnh / yếu', 'Gợi ý ý tưởng bài luận', 'Trợ lý AI Essay Copilot']
                  : ['Strengths/weaknesses analysis', 'Essay idea suggestions', 'AI Essay Copilot assistant']
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
                <img src="/persona_feature.jpg" alt="Persona Lab" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {lang === 'vi' ? 'Trải nghiệm toàn bộ tính năng' : 'Experience all features'}
            </h2>
            <p className="text-lg opacity-80 mb-8">
              {lang === 'vi' ? 'Đăng ký miễn phí và bắt đầu hành trình du học của bạn ngay hôm nay.' : 'Sign up for free and start your study abroad journey today.'}
            </p>
            <button 
              onClick={handleStart}
              className="inline-flex items-center justify-center rounded-md text-lg font-medium bg-white text-primary hover:bg-white/90 h-14 px-10 shadow-lg"
            >
              {lang === 'vi' ? 'Bắt đầu miễn phí' : 'Start for free'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      <PublicFooter lang={lang} />
    </div>
  );
}
