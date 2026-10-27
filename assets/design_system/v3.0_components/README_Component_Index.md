# 🚀 LifeEngine V3.0 Core Component Index (Developer Handover)

본 문서는 라이프이엔지 PoC 시뮬레이터의 핵심 비주얼 컴포넌트 세 가지에 대한 개발팀 핸드오프(Handoff) 문서입니다. 각 컴포넌트는 재사용성과 애니메이션 로직을 최우선으로 고려하여 설계되었으며, React/TypeScript 환경에서 즉시 구현 가능하도록 스니펫 및 상세 명세를 제공합니다.

**📌 핵심 원칙:**
1.  **권위성(Authority):** 모든 요소는 정밀하고 계산된 느낌을 유지해야 합니다.
2.  **감정적 전환 반영:** Deep Red $\to$ Transition/Accent $\to$ Cyan Blue의 시각적 흐름이 반드시 코드 로직에 녹아있어야 합니다.

---

## 🔴 1. Deep Red Error Graph Module (Risk Visualization)
*   **역할:** 시스템 실패나 데이터 불일치로 인한 급격한 리스크 증가를 감지자리에 제시합니다.
*   **파일명:** `DeepRedErrorGraph.tsx` 및 `Component-RawData_Spec.json` 참조.
*   **특징:** 시계열 데이터의 '급락(Drop)'을 표현하며, 배경 오버레이와 경고 애니메이션이 필수적입니다.

## 🟡 2. Filtering Gauge UI (Process Visualization)
*   **역할:** 무질서한 원시 데이터가 시스템 필터링 과정을 거쳐 통제된 정보로 전환되는 '과정'을 시각화합니다.
*   **파일명:** `FilteringGauge.tsx` 및 `Component-FilterArray_Spec.json` 참조.
*   **특징:** 게이지의 채움(Fill) 애니메이션이 핵심이며, 각 단계별 텍스트 피드백이 중요합니다.

## 🔵 3. Cyan Blue KPI Dashboard Widget (Control Result Display)
*   **역할:** 통제 시스템 작동 후 확보된 '안정적이고 측정 가능한 지표'를 권위적으로 보여줍니다.
*   **파일명:** `CyanBlueKPIDashboard.tsx` 및 `Component-CleanOutput_Spec.json` 참조.
*   **특징:** 미니멀리즘과 명확한 숫자 대비(Delta)가 강조되어야 합니다.

---