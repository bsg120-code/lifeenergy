// CyanBlueKPIDashboard.tsx - React Component Snippet
import React from 'react';

interface KpiData {
    title: string;
    value: number;
    delta: number; // 증감 값
    isPositive: boolean;
}

interface CyanBlueKPIDashboardProps {
    dataSets: KpiData[];
}

const CyanBlueKPIDashboard: React.FC<CyanBlueKPIDashboardProps> = ({ dataSets }) => {
    return (
        <div className="p-6 bg-[#1A1A2E] shadow-xl">
            <h3 className="text-2xl font-montserrat tracking-wider text-white mb-8 border-b border-[#00A8E0]/50 pb-4">
                ✅ 통제력 확보 대시보드 (Cyan Blue Zone)
            </h3>
            
            <div className="grid grid-cols-3 gap-6">
                {dataSets.map((kpi, index) => (
                    <div key={index} className={`p-6 rounded-xl border-l-4 transition duration-500 
                        ${kpi.isPositive ? 'border-[#00A8E0]' : 'border-gray-500'} bg-[#1F2937]/50 hover:bg-[#1f2d3a]`}>
                        <p className="text-sm font-medium text-gray-400 mb-2">{kpi.title}</p>
                        
                        {/* 메인 값 (가장 큰 강조점) */}
                        <h2 className={`text-5xl font-montserrat tracking-tighter ${kpi.isPositive ? 'text-[#00A8E0]' : 'text-yellow-400'}`}>
                            ${kpi.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </h2>

                        {/* 증감 표시 (Delta) */}
                        <div className={`mt-3 text-sm font-medium flex items-center ${kpi.isPositive ? 'text-[#00A8E0]' : 'text-red-400'}`}>
                            {kpi.delta > 0 ? (
                                <>
                                    ↑ {Math.abs(kpi.delta).toFixed(2)}% <span className="ml-1 text-green-400">({kpi.delta >= 0 ? '증가' : '감소'})</span>
                                </>
                            ) : (
                                `<span class="text-gray-500">N/A</span>`
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CyanBlueKPIDashboard;