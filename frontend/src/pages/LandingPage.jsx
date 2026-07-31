import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Heart, RefreshCcw, Search, FileText, Fingerprint } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import { useAuth } from '../context/useAuth';

export default function LandingPage({ lang }) {
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

  return (
    <div className="min-h-screen text-foreground flex flex-col relative overflow-hidden">
      {/* Background gradients - Blue like original PathSync */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40">
          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors border-primary/20 bg-primary/10 text-primary mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              {lang === 'vi' ? 'Người bạn đồng hành du học của bạn' : 'Your study abroad companion'}
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
              {lang === 'vi' ? 'Du học thật đơn giản cùng ' : 'Study abroad made simple with '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                PathSync
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {lang === 'vi' 
                ? 'Không còn hoang mang. Không còn áp lực. Mọi thứ bạn cần để đậu trường mơ ước, tất cả ở một nơi.' 
                : 'No more confusion. No more pressure. Everything you need to get into your dream school, all in one place.'}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleStart}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 w-full sm:w-auto shadow-lg shadow-blue-500/25 hover-scale"
              >
                {lang === 'vi' ? 'Bắt đầu ngay — Miễn phí' : 'Start now — Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button 
                onClick={() => navigate('/features')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-8 w-full sm:w-auto"
              >
                {lang === 'vi' ? 'Xem cách hoạt động' : 'See how it works'}
              </button>
            </div>
            
            {!token && (
              <p className="mt-6 text-sm text-muted-foreground">
                {lang === 'vi' ? 'Đã có tài khoản? ' : 'Already have an account? '}
                <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">
                  {lang === 'vi' ? 'Đăng nhập' : 'Log in'}
                </button>
              </p>
            )}
          </div>
        </section>

        {/* MARQUEE SECTION */}
        <section className="py-10 border-y bg-muted/30 overflow-hidden">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6">
            {lang === 'vi' ? 'Trường trong mơ? Chúng mình có hết' : 'Dream school? We have them all'}
          </p>
          <div className="relative flex overflow-x-hidden group">
            {(() => {
              const universities = [
                { name: 'Harvard', logo: '/images/universities/Harvard.png' },
                { name: 'Stanford', logo: '/images/universities/Stanford.png' },
                { name: 'MIT', logo: '/images/universities/MIT.png' },
                { name: 'Oxford', logo: '/images/universities/Oxford.png' },
                { name: 'Cambridge', logo: '/images/universities/Cambridge.png' },
                { name: 'NUS', logo: '/images/universities/NUS.png' },
                { name: 'ETH Zurich', logo: '/images/universities/ETH Zurich.png' },
                { name: 'Yale', logo: '/images/universities/Yale.png' },
                { name: 'Toronto', logo: '/images/universities/Toronto.png' },
                { name: 'Melbourne', logo: '/images/universities/Melbourne.png' },
              ];
              const renderUni = (uni, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={uni.logo} alt={uni.name} className="w-8 h-8 object-contain rounded-full bg-white p-1 shadow-sm" />
                  <span className="text-xl font-bold text-foreground">{uni.name}</span>
                </div>
              );
              return (
                <>
                  <div className="py-4 animate-marquee whitespace-nowrap flex items-center gap-12 sm:gap-24 opacity-80">
                    {universities.map(renderUni)}
                  </div>
                  <div className="absolute top-0 py-4 animate-marquee2 whitespace-nowrap flex items-center gap-12 sm:gap-24 opacity-80">
                    {universities.map(renderUni)}
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        {/* FEATURES PREVIEW */}
        <section className="py-24 container mx-auto px-4 space-y-32">
          {/* Feature 1 - Explore */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {lang === 'vi' ? 'Trường trong mơ đang chờ bạn' : 'Your dream school is waiting'}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lang === 'vi' 
                  ? 'Khám phá hàng ngàn chương trình học và học bổng. Công cụ lọc thông minh giúp bạn tìm ra những lựa chọn phù hợp nhất với hồ sơ của mình.' 
                  : 'Explore thousands of programs and scholarships. Smart filtering helps you find the best matches for your profile.'}
              </p>
              <ul className="space-y-4">
                {(lang === 'vi' 
                  ? ['Thông tin cập nhật liên tục', 'Đánh giá tỷ lệ đỗ bằng AI', 'So sánh học phí & sinh hoạt phí']
                  : ['Always up-to-date information', 'AI-powered acceptance rate evaluation', 'Compare tuition & living costs']
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-2xl transform rotate-3 scale-105" />
              <div className="bg-card border rounded-2xl shadow-xl overflow-hidden relative z-10">
                <img src="/explore_feature.jpg" alt="Explore Universities" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

          {/* Feature 2 - Applications */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl">
                <FileText className="h-8 w-8 text-indigo-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {lang === 'vi' ? 'Tạm biệt Excel hỗn loạn' : 'Goodbye messy spreadsheets'}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lang === 'vi' 
                  ? 'Quản lý toàn bộ quá trình nộp hồ sơ, deadline, và trạng thái cho từng trường ở cùng một nơi. Trực quan và dễ dàng.' 
                  : 'Manage your entire application process, deadlines, and status for each school in one place. Visual and easy.'}
              </p>
              <button 
                onClick={() => navigate('/features')}
                className="text-primary font-semibold hover:underline inline-flex items-center"
              >
                {lang === 'vi' ? 'Tìm hiểu thêm' : 'Learn more'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-2xl transform -rotate-3 scale-105" />
              <div className="bg-card border rounded-2xl shadow-xl overflow-hidden relative z-10">
                <img src="/applications_feature.jpg" alt="Application Tracking" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

          {/* Feature 3 - Persona Lab */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-xl">
                <Fingerprint className="h-8 w-8 text-purple-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {lang === 'vi' ? 'Câu chuyện của bạn là độc nhất' : 'Your story is unique'}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {lang === 'vi' 
                  ? 'Persona Lab phân tích con người bạn để gợi ý các ý tưởng viết luận (SOP) chân thật và ấn tượng nhất, giúp bạn nổi bật.' 
                  : 'Persona Lab analyzes who you are to suggest the most authentic and impressive essay ideas, helping you stand out.'}
              </p>
              <button 
                onClick={() => navigate('/features')}
                className="text-primary font-semibold hover:underline inline-flex items-center"
              >
                {lang === 'vi' ? 'Khám phá Persona Lab' : 'Explore Persona Lab'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-2xl transform rotate-3 scale-105" />
              <div className="bg-card border rounded-2xl shadow-xl overflow-hidden relative z-10">
                <img src="/persona_feature.jpg" alt="Persona Lab" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION */}
        <section className="py-24 bg-muted/30 border-y">
          <div className="container mx-auto px-4 text-center max-w-3xl mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {lang === 'vi' ? 'Và những điều cơ bản làm đúng' : 'And the basics done right'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {lang === 'vi' 
                ? 'Chúng mình tin rằng một công cụ tốt không chỉ cần tính năng hay, mà còn phải đáng tin cậy.' 
                : 'We believe a great tool needs not only good features, but also reliability.'}
            </p>
          </div>
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl border p-8 shadow-sm hover:shadow-md transition-shadow">
              <ShieldCheck className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">{lang === 'vi' ? 'Dữ liệu được bảo vệ' : 'Data protection'}</h3>
              <p className="text-muted-foreground">
                {lang === 'vi' ? 'Mọi thông tin cá nhân và bài luận đều được mã hóa an toàn. Bạn hoàn toàn kiểm soát dữ liệu của mình.' : 'All personal info and essays are safely encrypted. You are in full control of your data.'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-8 shadow-sm hover:shadow-md transition-shadow">
              <Heart className="h-10 w-10 text-red-500 mb-6" />
              <h3 className="text-xl font-bold mb-3">{lang === 'vi' ? 'Bạn không đơn độc' : 'You are not alone'}</h3>
              <p className="text-muted-foreground">
                {lang === 'vi' ? 'Đội ngũ hỗ trợ luôn sẵn sàng giải đáp thắc mắc và đồng hành cùng bạn trong suốt quá trình chuẩn bị.' : 'Our support team is always ready to answer questions and accompany you.'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-8 shadow-sm hover:shadow-md transition-shadow">
              <RefreshCcw className="h-10 w-10 text-indigo-500 mb-6" />
              <h3 className="text-xl font-bold mb-3">{lang === 'vi' ? 'Luôn cập nhật' : 'Always updated'}</h3>
              <p className="text-muted-foreground">
                {lang === 'vi' ? 'Hệ thống liên tục cập nhật thông tin về trường học, deadline và học bổng mới nhất mỗi ngày.' : 'The system continuously updates school info, deadlines and latest scholarships every day.'}
              </p>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
          <div className="container mx-auto px-4 text-center relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {lang === 'vi' ? 'Sẵn sàng bắt đầu?' : 'Ready to start?'}
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              {lang === 'vi' 
                ? 'Tham gia cùng hàng ngàn học sinh đang biến ước mơ du học thành hiện thực với PathSync.' 
                : 'Join thousands of students turning their study abroad dreams into reality with PathSync.'}
            </p>
            <button 
              onClick={handleStart}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 shadow-xl shadow-blue-500/20"
            >
              {lang === 'vi' ? 'Tạo tài khoản miễn phí' : 'Create a free account'}
            </button>
          </div>
        </section>
      </main>

      <PublicFooter lang={lang} />
    </div>
  );
}
