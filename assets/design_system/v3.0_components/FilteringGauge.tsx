// FilteringGauge.tsx - React Component Snippet
import React from 'react';

interface GaugeProps {
    progress: number; // 0 to 100
    stageName: string; // 현재 처리 단계 이름 (예: Raw Data -> Filtered)
}

const FilteringGauge: React.FC<GaugeProps> = ({ progress, stageName }) => {
    // [로직]: progress 값에 따라 게이지의 배경색과 채우기 색상(Fill Color)이 전환되어야 합니다.
    // Deep Red (Raw Data) -> Yellow (Filtering Process) -> Cyan Blue (Clean Output) 순서
    let fillColor = 'hsl(0, 80%, 30%)'; // 기본 Deep Red 값
    if (progress > 50) {
        fillColor = 'hsl(45, 100%, 50%)'; // Yellow/Orange 경고색
    } else if (progress === 100) {
        fillColor = '#00A8E0'; // Cyan Blue 통제 완료 색상
    }

    return (
        <div className="p-6 bg-[#1A1A2E] shadow-xl">
            <h3 className="text-2xl font-montserrat tracking-wider text-white mb-4">
                ⚙️ 시스템 필터링 엔진 활성화 (The Mechanism)
            </h3>

            {/* 게이지 컨테이너 */}
            <div className="w-[500px] h-16 relative mx-auto z-10">
                {/* 배경 원: 통제 전의 무질서함을 표현하는 희미한 패턴 */}
                <svg width="100%" height="100%" viewBox="0 0 500 100" className="absolute top-0 left-0 z-0">
                    <circle cx="250" cy="80" r="70" fill="none" stroke="#444" strokeWidth="6" opacity="0.3"/>
                </svg>

                {/* 채우는 부분 (Fill): 진행률에 따라 동적으로 변화 */}
                <svg width="100%" height="100%" viewBox="0 0 500 100" className="absolute top-0 left-0 z-20">
                    <circle cx="250" cy="80" r="70" fill="none" stroke={fillColor} strokeWidth="6" 
                        strokeDasharray="439.8" // 원의 둘레 길이 (2*pi*r)
                        strokeDashoffset={Math.max(0, 150 - progress * 1.5)} // 진행률에 따라 오프셋 조정
                        transform="rotate(-90 250 80)" />
                </svg>

                {/* 현재 단계 표시 */}
                <div className="absolute top-4 left-[calc(50%+30px)] transform -translate-y-1/2 z-30">
                    <p className="text-lg font-semibold text-[#FFC300]">현재 처리 단계: {stageName}</p>
                </div>
            </div>

            {/* 상세 설명 */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div><span className="text-xl font-bold text-[#9F222B]">Raw Data</span><p class="text-sm text-gray-400 mt-1">무질서한 정보 스트림 (Source ID: A, B)</p></div>
                <div className={`py-2 border-y ${progress > 50 ? 'border-[#FFC300]' : 'border-[#9F222B]'} text-lg font-bold`}>
                    {Math.round(progress)}% 완료
                </div>
                <div><span className="text-xl font-bold text-[#00A8E0]">Clean Output</span><p class="text-sm text-gray-400 mt-1">검증된 핵심 지표 (KPI: X)</p></div>
            </div>
        </div>
    );
};

export default FilteringGauge;