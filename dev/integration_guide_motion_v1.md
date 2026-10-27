# 🛠️ Deep Red $\to$ Cyan Blue Transition Engine 통합 개발 가이드 (v1.0)

## 🎯 목표: 정보 필터링 및 클렌징 효과의 구현
이 엔진은 단순한 색상 전환(Color Fade)이 아니라, **정보의 질적 변화**를 시뮬레이션해야 합니다. 기술적으로는 '데이터 필터링'을 중심으로 로직을 구축합니다.

## 🚀 핵심 스테이트 머신 로직 (State Machine Flow)
| State | Duration (Approx.) | Color Focus | Core Action | Development Notes |
| :--- | :--- | :--- | :--- | :--- |
| **S1: Crisis** | T+0:35 - T+0:38 (3s) | Deep Red ($\#9F222B$) | **Chaos Generation.** 모든 컴포넌트가 최대의 노이즈와 무질서도를 보여줍니다. 데이터는 과부하되고, 사운드는 고주파 경고음입니다. | 🔴 *Goal:* 시청자에게 압도적인 위협감(Threat)을 전달해야 합니다. 애니메이션 속도는 빠르고 불안정하게 유지합니다. |
| **S2: Transition** | T+0:38 - T+0:41 (3s) | Deep Red $\to$ Cyan Blue ($\#00A8E0$) | **Information Filtering & Cleansing.** 가장 중요한 기술 구간입니다. 모든 컴포넌트가 동시에 '필터링 효과'를 수행합니다. 이 단계에서 배경색이 깊은 어둠(Base/Authority)을 거쳐 Cyan Blue로 급격히 이동해야 합니다. | 🟡 *MUST:* 필터링 과정 시, 화면 전체에 짧고 날카로운 **디지털 노이즈 클리어 사운드**를 적용하여 전환의 임팩트를 극대화합니다. (Sound Design 참조) |
| **S3: Control** | T+0:42 - End | Cyan Blue ($\#00A8E0$) | **Structured Revelation.** 필터링을 통과한 깨끗하고 핵심적인 정보만이 화면에 안정적으로 자리 잡습니다. 데이터는 명확한 구조와 낮은 주파수의 사운드를 유지합니다. | 🔵 *Goal:* 시청자에게 '안도감(Relief)'과 '통제력 확보'를 느끼게 합니다. 모든 컴포넌트는 간결하고 정돈된 레이아웃을 유지해야 합니다. |

## 🛠️ 개발자를 위한 필수 가이드라인
1. **애니메이션 동기화:** 세 가지 컴포넌트(A, B, C)의 전환 시점은 **동일한 타이밍**에 시작되고 끝날 수 있도록 스케줄링하십시오. (T+0:38 Start / T+0:42 End).
2. **레이어 관리:** Deep Red 상태에서는 모든 컴포넌트가 최상위 레이어를 차지하며 시야를 가리는 듯한 '압박감'을 주어야 합니다. Cyan Blue 상태에서는 배경색과 함께 핵심 데이터만 전경(Foreground)에 배치하여 여유 공간(Negative Space)을 확보해야 합니다.
3. **Web/Video Export:** 모든 모션 컴포넌트는 Lottie (JSON/SVG 기반)와 ProRes Video 포맷으로 동시에 에셋화가 가능하도록 로직을 분리 설계하십시오.