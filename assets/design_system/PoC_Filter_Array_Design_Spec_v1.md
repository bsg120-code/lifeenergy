# 🎨 PoC Filter Array — Design Specification v1.0

**작성일**: 2026-10-27  
**작성자**: Designer (Collaboration)  
**검토 대상**: Figma 프로토타입 (`PoC_Diagnostic_Prototype_v3.figma`)

## 🎯 목표
Deep Red → Cyan Blue 전환 시점에서 '정보 필터링 및 클렌징 효과'를 시각적으로 구현하기 위한 컴포넌트 정의.

## 🔍 Figma 기반 구현 가능성 분석 결과

### ✅ 구현 가능 요소 (Green)
- **오버레이 그리드**: Figma 의 `Frame` 과 `Masking` 기능을 사용하여, 화면 전체에 격자 패턴을 적용할 수 있음.
- **스캔 라임 효과**: `Motion Brush` 또는 `Smart Animate` 를 활용하여, 격자에 따라 데이터 포인트를 스캔하는 애니메이션 구현 가능.
- **데이터 아카이빙**: `Blend Mode: Multiply` 및 `Opacity` 조절로, 필터링 전/후의 데이터 상태 (Raw vs Cleaned) 을 병렬적으로 표현할 수 있음.

### ⚠️ 주의 사항 (Yellow)
- **고해상도 에셋**: Figma 내부에서 렌더링되는 이미지 (예: 로고, 아이콘) 는 72dpi 기준이므로, 출력용 고해상도 PNG/SVG 를 별도 준비 필요.
- **애니메이션 성능**: Smart Animate 만으로는 복잡한 스캔 효과를 구현하기 어렵고, 외부 라이브러리 (GSAP 등) 연동이 필요할 수 있음.

### ❌ 제한 요소 (Red)
- Figma 내에서 직접 데이터 스트림 처리 로직을 구현할 수 없음 → 개발 팀이 별도의 프론트엔드 코드 (React/Canvas) 로 대체해야 함.

## 🛠️ 컴포넌트 정의 제안

| 구분 | 시각적 요소 | Figma 매핑 방법 | 개발팀 요구 사항 |
| :--- | :--- | :--- | :--- |
| **Filter Grid** | 반투명 격자 패턴 + 스캔 라임 | `Frame > Masking > Blend Mode` | Canvas 또는 SVG 렌더링 필요 |
| **Data Stream** | Raw 데이터 (오류 로그 등) → Cleaned KPI | `Group > Opacity Animation` | DOM vs Canvas 성능 테스트 |
| **Transition Engine** | Deep Red ↔ Cyan Blue 색상 전환 | `Smart Animate + Color Stop` | CSS 변수 또는 JS 로 동적 색상 변경 |

## 📌 다음 단계
1.  Figma 파일에 위 요소들을 컴포넌트 (Component) 로 정의하여 재사용성 확보.
2.  개발팀이 Canvas API 를 사용하여 실제 성능 테스트용 프로토타입 코드 작성.

Designer 가 완료한 후, 개발팀에 기술 명세서를 전달합니다.