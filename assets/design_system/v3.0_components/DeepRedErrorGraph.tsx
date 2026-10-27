// DeepRedErrorGraph.tsx - React Component Snippet
import React from 'react';

interface ErrorPoint {
    time: number; // Unix Timestamp or Index
    value: number; // Normalized value (e.g., 0 to 100)
}

interface DeepRedErrorGraphProps {
    data: ErrorPoint[]; // 시계열 데이터 배열
    containerId: string; // 그래프가 삽입될 컨테이너 ID
}

const DeepRedErrorGraph: React.FC<DeepRedErrorGraphProps> = ({ data, containerId }) => {
    // [로직]: 가장 최근 지점의 값(data[data.length - 1].value)을 기반으로 경고 상태를 결정합니다.
    const latestValue = data[data.length - 1]?.value || 0;
    const isCritical = latestValue > 85;

    // SVG Path 생성 로직 (실제 구현 시 복잡한 Bezier 곡선 계산 필요)
    // 예시: 데이터가 급락하는 지점(Deep Red 구간)을 강하게 강조
    const calculatePathD = () => {
        let pathD = 'M 0,100'; // 시작점 (좌상단 기준 y=100)
        data.forEach((point, index) => {
            // 가상의 데이터 처리: 급락 시 Y축 값을 키웁니다.
            const effectiveValue = point.value * 0.5 + (index > data.length - 3 ? 20 : 0); 
            pathD += ` L ${((index / data.length) * 100)}% ,${effectiveValue}%`;
        });
        return pathD;
    };

    return (
        <div className={`p-6 bg-[#1A1A2E] border-b-4 border-[#9F222B]/50 shadow-xl`}>
            <h3 className="text-2xl font-montserrat tracking-wider text-white mb-4">
                ⚠️ 실시간 리스크 모니터링 (Deep Red Zone)
            </h3>
            <div id={containerId} className="w-full h-80 relative">
                {/* 배경 Deep Red 오버레이 효과 */}
                <div className={`absolute inset-0 transition-opacity duration-1000 ${isCritical ? 'bg-[#9F222B]/40 animate-pulse' : 'bg-transparent'} z-10`}></div>
                
                {/* SVG 그래프 영역 */}
                <svg className="w-full h-full absolute top-0 left-0 z-20" viewBox="0 0 100 100">
                    {/* 축 및 그리드라인 (생략) */}
                    <path 
                        d={calculatePathD()} 
                        fill="none" 
                        stroke="#FFC300" // Warning Accent Color 사용
                        strokeWidth="4" 
                        className={`transition-all duration-1000 ${isCritical ? 'stroke-[6px]' : ''}`}
                    />
                </svg>

                 {/* 리스크 지표 카드 */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-30">
                    <div>
                        <p className="text-sm text-[#FFC300]">현재 위험 레벨</p>
                        <h4 className={`text-6xl font-montserrat tracking-tighter ${isCritical ? 'text-[#9F222B]' : 'text-white'}`}>
                            {latestValue.toFixed(1)}%
                        </h4>
                    </div>
                     <div className="bg-[#9F222B] p-3 text-sm rounded">
                        🚨 **CRITICAL WARNING** - 통제 공백 발생 (Control Gap)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeepRedErrorGraph;