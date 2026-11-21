# quick-plugin

Claude Code 입력창 위에 버튼 한 줄을 띄워 모델과 effort를 클릭 한 번으로 바꾸는 mod입니다.

## 기능

- **모델 전환** (왼쪽 버튼)

  | 버튼 | 모델 |
  | --- | --- |
  | 🧠 | Haiku 5.5 |
  | 🧠🧠 | Sonnet 5.5 |
  | 🧠🧠🧠 | Opus 5.5 |
  | 🧠🧠🧠🧠 | Fable 5.2 |

- **Effort 전환** (오른쪽 버튼)

  | 버튼 | Effort |
  | --- | --- |
  | 🔥 | low |
  | 🔥🔥 | medium |
  | 🔥🔥🔥 | high |
  | 🔥🔥🔥🔥 | xhigh |
  | 🔥🔥🔥🔥🔥 | max |

- 지금 쓰는 값은 `✓` 표시와 강조색으로 보입니다. `/model`·`/effort`를 직접 입력해 바꿔도 같이 갱신됩니다.
- `/quick-mode`를 입력하면 버튼 줄을 숨기고, 한 번 더 입력하면 다시 보입니다(지금 세션만).
- `/quick-mode off`는 플러그인을 끕니다. 버튼 줄과 상태 추적이 모두 멈추고, 새 세션에서도 꺼진 채로 유지됩니다. `/quick-mode on`으로 다시 켭니다.

## 설치

```
/plugin marketplace add rebase26-dot/quick-plugin
/plugin install quick-mode@quick-plugin
```

## 알려진 제약

- 버튼은 내부적으로 `/model`, `/effort` 명령을 실행합니다. 그래서 VSCode 확장에서는 누를 때마다 대화창에 `Prompt from the quick-mode plugin` 라벨이 붙은 명령 줄이 남습니다.
- 바꾼 값은 지금 세션에만 적용됩니다.

## 구조

```
.claude-plugin/marketplace.json      마켓플레이스 정의
plugins/quick-mode/
  .claude-plugin/plugin.json         플러그인 매니페스트
  hooks/register.tsx                 훅 (버튼 렌더링, 명령 실행)
  hooks/quick-mode.test.tsx          테스트
  types/index.d.ts                   플러그인 상태 타입
```
