import React from 'react';
import { Heart, Code, User, MapPin, Mail } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';

export default function AboutPage({ lang }) {

  const team = [
    { name: "Phan Thị Hải Yến", role: lang === 'vi' ? "CEO – Giám đốc Điều hành" : "Chief Executive Officer", avatar: "/images/team/member1.jpg" },
    { name: "Nguyễn Đào Nam Hải", role: lang === 'vi' ? "CTO – Giám đốc Công nghệ" : "Chief Technology Officer", avatar: "/images/team/member2.jpg" },
    { name: "Đồng Minh Dương", role: lang === 'vi' ? "CAIO – Giám đốc Trí tuệ Nhân tạo" : "Chief AI Officer", avatar: "/images/team/member3.jpg" },
    { name: "Nguyễn Đình Đạo", role: lang === 'vi' ? "CMO – Giám đốc Marketing" : "Chief Marketing Officer", avatar: "/images/team/member4.jpg" },
    { name: "Nguyễn Hà Linh Chi", role: lang === 'vi' ? "COO – Giám đốc Vận hành" : "Chief Operations Officer", avatar: "/images/team/member5.jpg" },
  ];

  return (
    <div className="min-h-screen text-foreground flex flex-col bg-transparent">
      <main className="flex-1">
        {/* HERO */}
        <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 border-b bg-muted/20 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary mb-8 border-primary/20">
              {lang === 'vi' ? 'Câu chuyện của mình' : 'Our Story'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              {lang === 'vi' ? 'Chúng mình đã từng ở ' : 'We have been in '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                {lang === 'vi' ? 'vị trí của bạn' : 'your shoes'}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {lang === 'vi' 
                ? 'Du học là một hành trình đầy thử thách. Chúng mình tạo ra PathSync để đảm bảo không ai phải đi qua hành trình đó một mình.' 
                : 'Studying abroad is a challenging journey. We built PathSync to ensure no one has to go through it alone.'}
            </p>
          </div>
        </section>

        {/* CORE VALUES */}
        <section className="py-24 container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {lang === 'vi' ? 'Tại sao chúng mình làm điều này' : 'Why we do this'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl border p-8 hover:shadow-md transition-shadow">
              <Heart className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">{lang === 'vi' ? 'Quan tâm thật sự' : 'True care'}</h3>
              <p className="text-muted-foreground">
                {lang === 'vi' ? 'Chúng mình thấu hiểu những lo âu của bạn vì chúng mình đã từng trải qua.' : 'We understand your anxieties because we have been through them.'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-8 hover:shadow-md transition-shadow">
              <Code className="h-10 w-10 text-indigo-500 mb-6" />
              <h3 className="text-xl font-bold mb-3">{lang === 'vi' ? 'Công nghệ có trái tim' : 'Tech with heart'}</h3>
              <p className="text-muted-foreground">
                {lang === 'vi' ? 'AI không thay thế bạn, nó giúp câu chuyện của bạn được kể một cách tốt nhất.' : 'AI does not replace you, it helps your story be told in the best way.'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border p-8 hover:shadow-md transition-shadow">
              <User className="h-10 w-10 text-purple-500 mb-6" />
              <h3 className="text-xl font-bold mb-3">{lang === 'vi' ? 'Xây dựng cho bạn' : 'Built for you'}</h3>
              <p className="text-muted-foreground">
                {lang === 'vi' ? 'Sản phẩm được thiết kế xoay quanh nhu cầu thực tế của học sinh Việt Nam.' : 'The product is designed around the real needs of Vietnamese students.'}
              </p>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="py-24 bg-muted/30 border-y">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {lang === 'vi' ? 'Những con người đằng sau PathSync' : 'The people behind PathSync'}
            </h2>
            <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
              {lang === 'vi' ? 'Một nhóm nhỏ với đam mê lớn, quyết tâm thay đổi cách học sinh Việt Nam tiếp cận du học.' : 'A small team with big passion, determined to change how Vietnamese students approach studying abroad.'}
            </p>
            
            {/* Leader row */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              {team.slice(0, 2).map((member, idx) => (
                <div key={idx} className="w-64 bg-card rounded-2xl border p-6 hover:shadow-md transition-shadow">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 mx-auto mb-4 bg-muted flex items-center justify-center">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-primary font-medium text-sm">{member.role}</p>
                </div>
              ))}
            </div>
            
            {/* Members row */}
            <div className="flex flex-wrap justify-center gap-8">
              {team.slice(2, 5).map((member, idx) => (
                <div key={idx} className="w-64 bg-card rounded-2xl border p-6 hover:shadow-md transition-shadow">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 mx-auto mb-4 bg-muted flex items-center justify-center">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-primary font-medium text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT FORM */}
        <section className="py-24 container mx-auto px-4 max-w-5xl">
          <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 lg:p-12 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
                <h2 className="text-3xl font-bold mb-4">
                  {lang === 'vi' ? 'Chào mình nhé!' : 'Say hello!'}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {lang === 'vi' ? 'Bạn có thắc mắc hoặc muốn hợp tác? Đừng ngần ngại liên hệ với chúng mình.' : 'Have a question or want to collaborate? Do not hesitate to contact us.'}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="w-5 h-5 mr-3 text-primary" />
                    hello@pathsync.ai
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-5 h-5 mr-3 text-primary" />
                    Hanoi, Vietnam
                  </div>
                </div>
              </div>
              <div className="p-10 lg:p-12 bg-card">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium mb-1">{lang === 'vi' ? 'Tên của bạn' : 'Your name'}</label>
                    <input type="text" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{lang === 'vi' ? 'Lời nhắn' : 'Message'}</label>
                    <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px]" placeholder={lang === 'vi' ? 'Bạn muốn nói gì với chúng mình...' : 'What would you like to say...'}></textarea>
                  </div>
                  <button type="submit" className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    {lang === 'vi' ? 'Gửi tin nhắn' : 'Send message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter lang={lang} />
    </div>
  );
}
