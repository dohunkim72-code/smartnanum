import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 스마트나눔 App의 첫 화면 컴포넌트입니다.
 */
function HomeScreen() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);
  const slideCount = 3;

  // 자동 슬라이드 타이머 설정
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slideCount;
        if (scrollRef.current) {
          const slideWidth = scrollRef.current.offsetWidth;
          scrollRef.current.scrollTo({
            left: slideWidth * next,
            behavior: 'smooth',
          });
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [slideCount]);

  // 홈 화면 진입 시 로그인 정보 초기화
  useEffect(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    // 추가적인 세션 정보가 있다면 여기에 추가
  }, []);

  // 수동 스크롤 시 인디케이터 동기화
  const handleScroll = (e) => {
    const index = Math.round(e.target.scrollLeft / e.target.offsetWidth);
    if (index !== currentSlide) {
      setCurrentSlide(index);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col overflow-x-hidden">
      {/* 헤더 영역 */}
      <header className="fixed top-0 left-0 w-full flex justify-center items-center h-20 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
        <h1 className="font-manrope font-black text-3xl text-indigo-600 tracking-tighter">스마트나눔</h1>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col pt-20 pb-[150px]">
        <section className="flex-1 flex flex-col px-container-margin mt-stack-lg">
          <div className="flex-1 flex flex-col">
            {/* 캐러셀 영역 */}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-gutter py-stack-md h-full"
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* 첫 번째 슬라이드 */}
              <div className="snap-center shrink-0 w-full flex flex-col">
                <div className="relative flex-1 min-h-[340px] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(79,70,229,0.05)] bg-slate-50 flex items-center justify-center">
                  <img 
                    className="max-w-full max-h-full object-contain p-2" 
                    src="/guide0.png" 
                    alt="가이드 0" 
                  />
                </div>
              </div>

              {/* 두 번째 슬라이드 */}
              <div className="snap-center shrink-0 w-full flex flex-col">
                <div className="relative flex-1 min-h-[340px] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(79,70,229,0.05)] bg-slate-50 flex items-center justify-center">
                  <img 
                    className="max-w-full max-h-full object-contain p-2" 
                    src="/guide1.png" 
                    alt="가이드 1" 
                  />
                </div>
              </div>

              {/* 세 번째 슬라이드 */}
              <div className="snap-center shrink-0 w-full flex flex-col">
                <div className="relative flex-1 min-h-[340px] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(79,70,229,0.05)] bg-slate-50 flex items-center justify-center">
                  <img 
                    className="max-w-full max-h-full object-contain p-2" 
                    src="/guide2.png" 
                    alt="가이드 2" 
                  />
                </div>
              </div>
            </div>

            {/* 인디케이터 */}
            <div className="flex justify-center gap-2 mt-stack-md">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  onClick={() => {
                    setCurrentSlide(i);
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({
                        left: scrollRef.current.offsetWidth * i,
                        behavior: 'smooth',
                      });
                    }
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentSlide === i ? 'w-8 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-outline-variant'
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <div className="mt-section-gap mb-20">
            <h2 className="font-headline-xl text-on-surface text-center mb-2">세상을 바꾸는 스마트한 습관</h2>
            <p className="font-body-md text-outline text-center">지금 바로 스마트나눔과 함께 따뜻한 변화를 시작해보세요.</p>
          </div>
        </section>
      </main>

      {/* 하단 버튼 영역 */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/80 backdrop-blur-md px-container-margin py-stack-lg flex flex-col gap-stack-md z-40 pb-4">
        <button 
          onClick={() => navigate('/login')}
          className="w-full h-14 bg-primary text-on-primary font-label-md text-body-lg rounded-xl shadow-md active:scale-95 transition-transform duration-200 flex items-center justify-center"
        >
          로그인
        </button>
        <button 
          onClick={() => navigate('/calculator')}
          className="w-full h-14 bg-tertiary-fixed text-primary font-label-md text-body-lg rounded-xl border border-primary/10 active:scale-95 transition-transform duration-200 flex items-center justify-center"
        >
          기부 한도 계산하기
        </button>
      </footer>

    </div>
  );
}

export default HomeScreen;
