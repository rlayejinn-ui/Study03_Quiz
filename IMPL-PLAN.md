# 상식 퀴즈 웹 앱 구현 계획서 (IMPL-PLAN)

> **구현하는 쪽(에이전트)에게:** 필수 하위 스킬 — `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`로 이 계획을 작업 단위(Task)별로 실행한다. 각 단계(Step)는 체크박스(`- [ ]`)로 진행 상황을 표시한다.

**목표:** 대학 1학년 학생이 혼자 상식을 공부하는 4지선다 퀴즈 웹 앱을, 서버 없이 `index.html`을 열기만 해도 동작하게 3단계로 나누어 만든다.

**구조:** 일반 `<script>` 2개(`questions.js` → `script.js`)와, `index.html`에 미리 만들어 둔 `<section>` 화면을 `hidden`으로 전환하는 방식이다. `script.js`는 ①상수 ②순수 로직 ③상태 ④저장소 ⑤화면 그리기 ⑥이벤트와 시작, 6개 블록으로 나눈다. 모드(연습·스피드·힌트)는 `모드설정` 값으로만 구분하고, 화면·이벤트 코드는 모드 이름으로 `if`를 가르지 않는다.

**기술:** HTML, CSS, 순수 JavaScript(ES2020 정도), `localStorage`. 빌드 도구·패키지·Node 없음.

**기준 문서:** [PRD.md](PRD.md) (기준), [설계 문서](docs/superpowers/specs/2026-10-09-상식퀴즈-design.md) (승인 기록. 둘이 어긋나면 PRD가 기준)

**읽는 법:** 실행자는 이 계획과 PRD를 함께 읽습니다. 이 계획서는 앞선 대화를 모르는 실행자(새 세션이나 에이전트)도 따라 할 수 있게 썼습니다. 계획서 끝의 "PRD 대응"은 PRD의 항목마다 그것을 구현하는 작업을 적은 표이고, PRD에서 빠진 요구가 없는지 확인할 때 씁니다. 계획서가 PRD에 없는 것을 정한 곳은 맨 끝 "이 계획서가 정한 사항"에 모아 두었습니다.

## 전역 제약 (모든 작업에 적용 — PRD 7장에서 그대로 옮김)

- 실행 방식: 서버 없이 `index.html`을 더블클릭해 브라우저(`file://`)에서 연다.
- 파일 구성: `index.html`, `style.css`, `script.js`, `questions.js` **4개만** 사용한다. (문서 `PRD.md`, `IMPL-PLAN.md`, `docs/`는 제외)
- 스크립트: 일반 `<script src>`만 쓴다. `questions.js`를 먼저, `script.js`를 나중에 읽는다. **`type="module"`, `import`/`export`, `fetch`·`XMLHttpRequest`로 파일 읽기는 쓰지 않는다.**
- 외부 의존: CDN·웹 폰트·외부 이미지 없이 오프라인에서 동작한다.
- 언어: 화면 문구, 코드 주석, 변수·함수 이름은 한글로 쓴다 (외부 API 이름과 문법상 영문만 가능한 곳은 예외). 커밋 메시지도 한글.
- 브라우저: 최신 Chrome, Edge에서 확인한다. Firefox는 가능하면 확인한다.
- 화면 크기: 폭 360px 휴대폰부터 데스크톱까지 가로 스크롤 없이 쓸 수 있다.
- 접근성: 보기와 버튼은 키보드로 조작할 수 있는 `<button>`으로 만든다. 정답/오답은 색에만 의존하지 않고 글자로도 표시한다.
- 코드 구조: 화면은 `<section>` + `hidden` 전환. 상태 객체 `상태` 하나. 점수 계산 등은 화면과 분리된 순수 함수.
- 단계마다 끝날 때 **확인한 것과 확인하지 못한 것을 구분해 보고**한다.
- **각 단계가 끝나면 작업을 멈추고**, 사용자가 "내가 브라우저에서 직접 확인할 항목"을 확인한 뒤에야 다음 단계로 간다.
- 푸시·배포는 하지 않는다. 커밋은 로컬에만 한다.

## 검토 포인트 (Review Focus)

PRD가 직접 말하지 않지만 실제로 쓰다 보면 만나기 쉬운 입력·상황 5가지. 각 줄의 시험은 해당 코드를 만드는 작업(Task) 안에 들어 있다.

1. **`questions.js`를 못 읽었거나 문법이 깨졌을 때** — 빈 화면이 아니라 "questions.js를 읽지 못했습니다" 안내가 보여야 한다. → Task 1.3
2. **보기를 연타하거나, 선택과 시간 초과가 거의 동시에 일어날 때** — 한 문항은 한 번만 채점된다(점수가 두 번 오르지 않음). → Task 1.2 (연타), Task 2.2 (시간 초과와 동시)
3. **타이머가 남아 있다가 다음 판·다른 화면에 영향을 줄 때** — [그만하기]·해설 표시·결과 화면 뒤에 `setInterval`이 살아 있으면 안 된다. → Task 2.2
4. **닉네임에 공백만, `<b>태그</b>`, 이모지, 붙여넣어 10자를 넘는 글을 넣을 때** — 공백만이면 "익명", 태그는 글자 그대로 표시(HTML로 해석되지 않음), 10자 초과는 잘라서 저장. → Task 3.2
5. **`localStorage` 값이 `null`, `[]`, 배열이 아닌 목록, 점수가 문자열인 항목처럼 모양이 어긋났을 때** — 오류로 멈추지 않고 걸러 내며, 순위표 쪽에만 안내가 보인다. → Task 3.1

---

## 선행 작업 (단계 아님) — 문항 40개

1단계를 시작하려면 **검토를 통과한 `questions.js`**(카테고리 4개 × 10문항, 6장 규칙 충족)가 프로젝트 폴더에 있어야 한다. 이 계획서는 문항 내용을 만들지 않는다. 문항이 없으면 1단계를 시작하지 않는다 (Task 1.1 Step 1에서 확인).

- 6.1 정답은 하나만 / 6.2 실제로 열람해 확인한 출처 / 6.3 최상급 표현에는 문제 문장 안에 기준과 시점.
- 작성한 40문항은 사용자가 읽고 검토한 뒤 확정한다.

## 파일 구조

| 파일 | 하는 일 | 생기는 단계 |
|---|---|---|
| `questions.js` | 전역 `const 문항목록 = [...]` 하나만. 로직 없음 | 선행 |
| `index.html` | 화면 `<section>`들을 미리 만들어 둠. 스크립트 2개 읽기 | 1단계에서 만들고 2·3단계에서 화면 추가 |
| `style.css` | 모양 | 1단계에서 만들고 2·3단계에서 덧붙임 |
| `script.js` | 6개 블록 (위 구조 참고) | 1단계에서 만들고 계속 늘어남 |

## 검증 방법 (Node 없음)

- **두 가지 목록의 역할:** 각 단계의 "완료 기준"은 실행자(클로드)가 검사 코드와 화면 조작으로 스스로 점검하는 목록이고, "내가 브라우저에서 직접 확인할 항목"은 사람이 브라우저에서 눈으로 확인하는 목록이다. 검사 코드는 파일로 두지 않고 이 계획서에만 있으므로 앱 파일은 4개가 유지된다.
- **콘솔 검사:** 페이지를 연 뒤 브라우저 콘솔(F12 → Console)에 아래 "검사 코드"를 붙여 넣는다. 모든 검사 코드는 실패한 항목 이름의 배열을 돌려주며, **기대 결과는 `[]`(빈 배열)** 이다. 에이전트는 내장 브라우저의 `javascript_tool`로 같은 코드를 실행한다.
- **화면 조작:** 내장 브라우저에서 `file:///C:/학교과제/Study03_Quiz/index.html`을 연다. `file://`을 못 열면 그 사실을 알리고 사용자가 Edge/Chrome에서 직접 열어 확인하는 방식으로 바꾼다.
- **`confirm` 대화상자:** 자동 조작 중에는 상자가 멈출 수 있으므로 콘솔에서 `window.confirm = () => true`를 먼저 실행한다. (사용자가 직접 확인할 때는 필요 없음)
- **커밋 형식:** 한글 메시지 + 아래 꼬리말.

```bash
git commit -m "한글 메시지" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

# 1단계 — 연습 모드와 점수

## 만들 것

- 시작 화면: 카테고리 4개 버튼, "연습 모드 · 순위표에 기록되지 않음" 문구.
- 문제 화면: 맨 위에 "카테고리 · 모드"(예: 한국사 · 연습), 진행(예: 3 / 10), 현재 점수(예: 점수 0), [그만하기]. 그 아래 문제와 보기 4개. 문항 순서와 보기 순서는 판마다 무작위. (모드 이름과 점수 표시는 PRD 2장에 없는 것을 이 계획서가 더한 것 — 맨 끝 "정한 사항" 참고)
- 해설 영역: 보기를 고르면 곧바로 정오(색 + 글자), 정답 보기, 한 줄 해설, 출처, [다음](마지막은 [결과 보기]). 보기는 한 번만 고를 수 있고 고른 뒤 잠긴다.
- 결과 화면: `n / 10` 점수, "순위표에 기록되지 않음", [다시 하기] [처음으로].
- 시작 시 `형식점검`으로 문항 데이터를 점검하고, 오류가 있으면 오류 화면에 어느 문항이 왜 틀렸는지 표시.
- 모드 선택 화면, 시간 제한, 힌트, 다시 풀기는 **아직 없다.**

## 완료 기준

- [ ] `index.html`을 더블클릭해 열면 카테고리 4개가 보인다.
- [ ] 카테고리를 고르면 그 카테고리의 10문제가 무작위 순서로 나오고, 보기 순서도 문항마다 섞여 있다.
- [ ] 문제 화면 위쪽에 "카테고리 · 연습", "n / 10", "점수 n"이 보이고, 보기를 고를 때마다 점수가 갱신된다.
- [ ] 보기를 고르면 곧바로 정답 여부, 정답 보기, 한 줄 해설, 출처가 보인다. 정답 여부는 색뿐 아니라 글자로도 구분된다.
- [ ] 같은 문항에서 보기를 다시 고를 수 없다.
- [ ] 10문제가 끝나면 "n / 10" 점수가 보인다. 정답은 1점, 오답은 0점.
- [ ] 시작 화면과 결과 화면에 "순위표에 기록되지 않음"이 표시된다.
- [ ] 결과 화면에서 다시 하기와 처음으로 돌아가기가 동작한다.
- [ ] [그만하기]를 누르고 확인하면 시작 화면으로 돌아가고 점수는 남지 않는다.
- [ ] 시간 제한과 힌트는 어디에도 나타나지 않는다.
- [ ] 콘솔 오류 0건, 폭 360px에서 가로 스크롤 없음.

## 내가 브라우저에서 직접 확인할 항목

탐색기에서 `C:\학교과제\Study03_Quiz\index.html`을 더블클릭해 Chrome이나 Edge로 연 뒤:

1. **시작 화면** — "한국사 / 세계지리 / 과학 / 예술과 문화" 버튼 4개와 "연습 모드 · 순위표에 기록되지 않음"이 보인다.
2. **문제 화면** — 카테고리 하나(예: 한국사)를 누른다. 위쪽에 "한국사 · 연습", `1 / 10`, "점수 0"이 보이고, 보기 4개가 있다. 시간(타이머)이나 힌트 버튼은 없다.
3. **정답을 눌러 보기** — 정답이라고 생각하는 보기를 누른다. "정답입니다!" 같은 **글자**와 초록색이 나오고, 해설과 출처가 보이며, 위쪽 점수가 "점수 1"로 바뀐다. 다른 보기를 눌러도 아무 변화가 없다.
4. **오답을 눌러 보기** — 다음 문제에서 일부러 틀린 보기를 누른다. "틀렸습니다"라는 글자와 빨간색이 나오고, 정답 보기에 "— 정답" 표시가 붙는다. 색을 못 보는 사람도 구분할 수 있는지 글자만 보고 판단해 본다.
5. **끝까지 풀기** — 마지막 문제에서 버튼이 [다음] 대신 [결과 보기]로 바뀌는지, 결과에 "n / 10"이 **내가 맞힌 개수와 같은지** 직접 세어 본다. 결과 화면에 "순위표에 기록되지 않음"이 보인다.
6. **섞임** — [다시 하기]를 눌러 같은 카테고리를 다시 푼다. 문제 순서와 보기 순서가 처음과 다르다.
7. **그만하기** — 문제 도중 [그만하기] → 취소를 누르면 계속 풀 수 있고, 다시 [그만하기] → 확인을 누르면 시작 화면으로 돌아온다. 이어서 카테고리를 고르면 `1 / 10`부터 새로 시작한다.
8. **처음으로** — 결과 화면에서 [처음으로]를 누르면 시작 화면이 나온다.
9. **키보드** — Tab과 Enter/Space만으로 카테고리 선택부터 보기 선택, [다음]까지 진행된다.
10. **좁은 화면** — 창 폭을 360px 정도로 줄여도 가로 스크롤바가 생기지 않는다. F12 → Console에 빨간 오류가 없다.

## 작업 (Tasks)

### Task 1.1: 뼈대(HTML·CSS)와 순수 로직

**Files:**
- Create: `index.html`, `style.css`, `script.js`
- Check: `questions.js` (선행 작업 결과)

**Interfaces:**
- Consumes: 전역 `문항목록` (`{카테고리, 문제, 보기[4], 정답, 해설, 출처}` 배열)
- Produces (script.js ①②):
  - 상수 `카테고리목록`, `문항수`, `모드설정`
  - `섞기(배열) → 새 배열`
  - `출제문항만들기(문항) → {문제, 보기:[{글, 정답여부}], 해설, 출처}`
  - `판만들기(카테고리) → 출제문항[]`
  - `점수계산(모드, 맞힘, 힌트썼음) → 숫자`
  - `점수글(모드, 점수) → 문자열` (힌트후점수가 있는 모드는 소수 첫째 자리, 아니면 정수)
  - `형식점검(목록) → 오류 문자열[]`

- [ ] **Step 1: 선행 작업 확인**

`questions.js`가 있고 사용자가 검토를 마쳤는지 확인한다.

```bash
ls -la questions.js && grep -c "카테고리:" questions.js
```

기대: 파일이 있고 `40`이 나온다. 없거나 사용자의 검토 확인이 없으면 **여기서 멈추고** 사용자에게 알린다.

- [ ] **Step 2: 설계 문서와 문항을 커밋으로 남긴다**

`PRD.md`와 `IMPL-PLAN.md`는 구현을 시작하기 전에 첫 커밋으로 이미 올라가 있다. 여기서는 설계 문서와 검토된 문항만 올린다.

```bash
git add docs questions.js
git commit -m "설계 문서와 검토된 문항 40개 추가" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: `index.html` 만들기** (1단계 화면 전부)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <section id="화면-시작" hidden>
      <h1>상식 퀴즈</h1>
      <p class="안내">연습 모드 · 순위표에 기록되지 않음</p>
      <div id="카테고리버튼들" class="버튼줄"></div>
    </section>

    <section id="화면-문제" hidden>
      <div class="윗줄">
        <span id="문제카테고리"></span>
        <span id="문제진행"></span>
        <span id="문제점수"></span>
        <button id="그만하기버튼" type="button">그만하기</button>
      </div>
      <h2 id="문제문장"></h2>
      <div id="보기목록" class="보기목록"></div>
      <div id="해설영역" hidden>
        <p id="정오표시" role="status"></p>
        <p id="획득점수줄"></p>
        <p id="정답안내"></p>
        <p id="해설글"></p>
        <p id="출처글" class="안내"></p>
        <button id="다음버튼" type="button">다음</button>
      </div>
    </section>

    <section id="화면-결과" hidden>
      <h2>결과</h2>
      <p id="결과점수" class="큰점수"></p>
      <p id="결과안내" class="안내">순위표에 기록되지 않음</p>
      <div class="버튼줄">
        <button id="다시하기버튼" type="button">다시 하기</button>
        <button id="처음으로버튼" type="button">처음으로</button>
      </div>
    </section>

    <section id="화면-오류" hidden>
      <h2>문항 데이터를 확인해 주세요</h2>
      <ul id="오류목록"></ul>
    </section>
  </main>

  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 4: `style.css` 만들기**

```css
:root {
  --글자: #1f2933;
  --배경: #f5f7fa;
  --카드: #ffffff;
  --테두리: #cbd2d9;
  --강조: #2f5fd0;
  --맞음: #1b7a3a;
  --맞음배경: #e3f6e8;
  --틀림: #b42318;
  --틀림배경: #fdecea;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

body {
  margin: 0;
  font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  color: var(--글자);
  background: var(--배경);
  line-height: 1.6;
}

main { max-width: 40rem; margin: 0 auto; padding: 1rem; }

section {
  background: var(--카드);
  border: 1px solid var(--테두리);
  border-radius: 12px;
  padding: 1.25rem;
  overflow-wrap: anywhere;
}

h1, h2 { margin-top: 0; }

button {
  font: inherit;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--강조);
  border-radius: 8px;
  background: var(--카드);
  color: var(--강조);
  cursor: pointer;
}
button:hover:not(:disabled) { background: #eaf0ff; }
button:disabled { cursor: default; }
button:focus-visible,
input:focus-visible,
select:focus-visible { outline: 3px solid #f5a623; outline-offset: 2px; }

.버튼줄 { display: grid; gap: 0.75rem; }
.윗줄 {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.안내 { color: #52606d; }
.큰점수 { font-size: 2rem; font-weight: 700; margin: 0.5rem 0; }

.보기목록 { display: grid; gap: 0.75rem; }
.보기 { width: 100%; text-align: left; color: var(--글자); border-color: var(--테두리); }
.보기:disabled:not(.정답):not(.오답) { opacity: 0.6; }
.보기.정답 { background: var(--맞음배경); border: 2px solid var(--맞음); color: var(--맞음); font-weight: 700; }
.보기.오답 { background: var(--틀림배경); border: 2px solid var(--틀림); color: var(--틀림); font-weight: 700; }

#해설영역 { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--테두리); }
.맞음 { color: var(--맞음); font-weight: 700; }
.틀림 { color: var(--틀림); font-weight: 700; }
```

- [ ] **Step 5: `script.js`에 상수 블록만 넣고, 실패하는 검사를 먼저 돌린다**

`script.js`:

```js
// ① 상수 ------------------------------------------------------------
const 카테고리목록 = ["한국사", "세계지리", "과학", "예술과 문화"];
const 문항수 = 10;

// 화면·이벤트 코드는 모드 이름으로 if를 가르지 않고 이 값만 본다.
const 모드설정 = {
  연습:   { 제한시간: null, 힌트: false, 맞힘점수: 1, 힌트후점수: null, 순위표: false, 다시풀기: true },
  스피드: { 제한시간: 15,   힌트: false, 맞힘점수: 1, 힌트후점수: null, 순위표: true,  다시풀기: false },
  힌트:   { 제한시간: null, 힌트: true,  맞힘점수: 1, 힌트후점수: 0.5,  순위표: true,  다시풀기: false },
};
```

브라우저에서 `index.html`을 열고 콘솔에 아래 검사 코드를 붙여 넣는다.

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };

  // 점수계산 · 점수글
  확인("연습 맞힘 1점", 점수계산("연습", true, false) === 1);
  확인("연습 틀림 0점", 점수계산("연습", false, false) === 0);
  확인("점수글 연습은 정수", 점수글("연습", 7) === "7");
  확인("점수글 힌트는 소수 첫째 자리", 점수글("힌트", 7.5) === "7.5" && 점수글("힌트", 8) === "8.0");

  // 섞기
  const 원본 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const 원본글 = 원본.join();
  const 섞인것들 = Array.from({ length: 20 }, () => 섞기(원본));
  확인("섞기: 원본 그대로", 원본.join() === 원본글);
  확인("섞기: 순서가 달라짐", 섞인것들.some(배열 => 배열.join() !== 원본글));
  확인("섞기: 같은 원소", 섞인것들.every(배열 => [...배열].sort((a, b) => a - b).join() === 원본글));

  // 판만들기
  const 문항원본글 = JSON.stringify(문항목록);
  for (const 카테고리 of 카테고리목록) {
    const 판 = 판만들기(카테고리);
    확인(`${카테고리}: 10문항`, 판.length === 문항수);
    판.forEach(출제 => {
      const 원문 = 문항목록.find(m => m.카테고리 === 카테고리 && m.문제 === 출제.문제);
      확인(`${카테고리}: 원문 있음 (${출제.문제})`, !!원문);
      if (!원문) return;
      확인(`${카테고리}: 보기 4개`, 출제.보기.length === 4);
      확인(`${카테고리}: 정답 1개`, 출제.보기.filter(b => b.정답여부).length === 1);
      확인(`${카테고리}: 정답 글 일치`, 출제.보기.find(b => b.정답여부).글 === 원문.보기[원문.정답]);
      확인(`${카테고리}: 보기 글 집합 같음`, 출제.보기.map(b => b.글).sort().join("|") === [...원문.보기].sort().join("|"));
    });
  }
  확인("판만들기가 원본 문항목록을 바꾸지 않음", JSON.stringify(문항목록) === 문항원본글);

  // 형식점검
  const 복사 = () => JSON.parse(JSON.stringify(문항목록));
  확인("형식점검: 정상 데이터는 오류 0건", 형식점검(문항목록).length === 0);
  const 깨뜨리기 = [
    ["보기 3개", 목록 => { 목록[0].보기.pop(); }, "보기가 4개"],
    ["해설 비움", 목록 => { 목록[1].해설 = "  "; }, "해설이 비어"],
    ["출처 비움", 목록 => { 목록[2].출처 = ""; }, "출처가 비어"],
    ["정답 4", 목록 => { 목록[3].정답 = 4; }, "정답이 0~3"],
    ["보기 중복", 목록 => { 목록[4].보기[1] = 목록[4].보기[0]; }, "서로 다르지"],
    ["문항 9개", 목록 => { 목록.pop(); }, "문항이"],
  ];
  깨뜨리기.forEach(([이름, 고치기, 찾을말]) => {
    const 목록 = 복사();
    고치기(목록);
    확인(`형식점검: ${이름}`, 형식점검(목록).some(글 => 글.includes(찾을말)));
  });
  확인("형식점검: 배열이 아니면 오류", 형식점검(null).length > 0);

  return 실패;
})()
```

기대: `ReferenceError: 점수계산 is not defined` (실패).

- [ ] **Step 6: ② 순수 로직 구현** — `script.js` 맨 아래에 이어 붙인다

```js
// ② 순수 로직 (화면과 무관) ---------------------------------------------
// 원본을 건드리지 않고 무작위로 섞은 새 배열을 돌려준다 (Fisher–Yates).
function 섞기(배열) {
  const 복사 = [...배열];
  for (let i = 복사.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [복사[i], 복사[j]] = [복사[j], 복사[i]];
  }
  return 복사;
}

function 출제문항만들기(문항) {
  const 보기 = 문항.보기.map((글, 위치) => ({ 글, 정답여부: 위치 === 문항.정답 }));
  return { 문제: 문항.문제, 보기: 섞기(보기), 해설: 문항.해설, 출처: 문항.출처 };
}

// 해당 카테고리의 문항을 섞고, 문항마다 보기도 섞어서 한 판을 만든다.
function 판만들기(카테고리) {
  const 해당문항 = 문항목록.filter(문항 => 문항.카테고리 === 카테고리);
  return 섞기(해당문항).map(출제문항만들기);
}

// 맞히고 힌트를 썼으면 힌트후점수, 맞히면 맞힘점수, 틀리면 0
function 점수계산(모드, 맞힘, 힌트썼음) {
  const 설정 = 모드설정[모드];
  if (!맞힘) return 0;
  if (힌트썼음 && 설정.힌트후점수 !== null) return 설정.힌트후점수;
  return 설정.맞힘점수;
}

// 0.5점 단위가 있는 모드(힌트후점수가 있는 모드)는 소수 첫째 자리까지 보여 준다.
function 점수글(모드, 점수) {
  return 모드설정[모드].힌트후점수 !== null ? 점수.toFixed(1) : String(점수);
}

// 문항 데이터가 규칙에 맞는지 점검해 오류 문장 목록을 돌려준다 (정상이면 빈 배열).
function 형식점검(목록) {
  if (!Array.isArray(목록)) return ["문항목록이 배열이 아닙니다."];
  const 오류 = [];
  const 비었음 = 값 => typeof 값 !== "string" || 값.trim() === "";

  카테고리목록.forEach(카테고리 => {
    const 개수 = 목록.filter(문항 => 문항 && 문항.카테고리 === 카테고리).length;
    if (개수 !== 문항수) 오류.push(`${카테고리}: 문항이 ${개수}개입니다 (${문항수}개여야 함)`);
  });

  목록.forEach((문항, 순번) => {
    const 이름 = `${순번 + 1}번째 문항(${문항 && 문항.카테고리})`;
    if (!문항 || typeof 문항 !== "object") { 오류.push(`${이름}: 문항이 객체가 아님`); return; }
    if (!카테고리목록.includes(문항.카테고리)) 오류.push(`${이름}: 알 수 없는 카테고리`);
    if (비었음(문항.문제)) 오류.push(`${이름}: 문제가 비어 있음`);
    if (!Array.isArray(문항.보기) || 문항.보기.length !== 4) {
      오류.push(`${이름}: 보기가 4개가 아님`);
    } else if (new Set(문항.보기).size !== 4) {
      오류.push(`${이름}: 보기가 서로 다르지 않음`);
    }
    if (!Number.isInteger(문항.정답) || 문항.정답 < 0 || 문항.정답 > 3) 오류.push(`${이름}: 정답이 0~3이 아님`);
    if (비었음(문항.해설)) 오류.push(`${이름}: 해설이 비어 있음`);
    if (비었음(문항.출처)) 오류.push(`${이름}: 출처가 비어 있음`);
  });
  return 오류;
}
```

- [ ] **Step 7: 검사 코드를 다시 실행해 통과를 확인한다**

페이지를 새로고침한 뒤 Step 5의 검사 코드를 다시 실행한다. 기대: `[]`

- [ ] **Step 8: 커밋**

```bash
git add index.html style.css script.js
git commit -m "1단계: 화면 뼈대와 순수 로직(섞기, 판만들기, 점수계산, 형식점검) 추가" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 1.2: 한 판 진행 (상태 · 화면 · 이벤트)

**Files:**
- Modify: `script.js` (③ 상태, ⑤ 화면 그리기, ⑥ 이벤트와 시작을 아래 이어 붙임)

**Interfaces:**
- Consumes: Task 1.1의 `카테고리목록`, `문항수`, `모드설정`, `판만들기`, `점수계산`, `점수글`
- Produces:
  - `상태` (전역 객체), `상태초기화()`, `현재문항()`
  - `화면보이기(이름)` — 이름은 `시작|문제|결과|오류` (id는 `화면-${이름}`)
  - `시작화면그리기()`, `판시작(모드, 카테고리)`, `문제내기()`, `문제그리기()`, `점수그리기()` (문제 화면 위쪽 "점수 n")
  - `채점하기(위치)` — `위치`가 `null`이면 시간 초과(오답). `상태.해설중`이면 무시
  - `해설보이기(고른위치, 맞힘, 획득점수)`, `다음으로()`, `결과그리기()`
  - `타이머끄기()` (1단계에서는 타이머가 없으므로 안전한 빈 동작)

- [ ] **Step 1: 실패하는 검사를 먼저 돌린다**

`script.js` 맨 아래에 아직 아무것도 없는 상태에서, 페이지를 연 뒤 콘솔에서 실행한다.

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  window.confirm = () => true;

  const 보이는화면 = () => [...document.querySelectorAll("main > section")].filter(s => !s.hidden).map(s => s.id);
  확인("시작 화면만 보임", 보이는화면().join() === "화면-시작");
  확인("카테고리 버튼 4개", document.querySelectorAll("#카테고리버튼들 button").length === 4);

  // 7개 맞히고 3개 틀리기 (과학)
  document.querySelectorAll("#카테고리버튼들 button")[2].click();
  확인("문제 화면으로 이동", 보이는화면().join() === "화면-문제");
  for (let 번 = 0; 번 < 문항수; 번++) {
    const 문항 = 상태.출제목록[상태.현재번호];
    const 정답위치 = 문항.보기.findIndex(b => b.정답여부);
    확인(`${번 + 1}번: 진행 표시`, document.getElementById("문제진행").textContent === `${번 + 1} / 10`);
    확인(`${번 + 1}번: 위쪽에 카테고리 · 모드와 점수`, document.getElementById("문제카테고리").textContent === "과학 · 연습"
      && document.getElementById("문제점수").textContent === `점수 ${번 < 7 ? 번 : 7}`);
    확인(`${번 + 1}번: 해설 영역 처음엔 숨김`, document.getElementById("해설영역").hidden === true);
    const 고름 = 번 < 7 ? 정답위치 : (정답위치 + 1) % 4;
    document.querySelectorAll("#보기목록 button")[고름].click();
    const 맞음 = 번 < 7;
    확인(`${번 + 1}번: 정오 글자`, document.getElementById("정오표시").textContent.includes(맞음 ? "정답입니다" : "틀렸습니다"));
    확인(`${번 + 1}번: 해설·출처 표시`, document.getElementById("해설글").textContent.includes(문항.해설) && document.getElementById("출처글").textContent.includes(문항.출처));
    확인(`${번 + 1}번: 점수 갱신`, document.getElementById("문제점수").textContent === `점수 ${번 < 7 ? 번 + 1 : 7}`);
    확인(`${번 + 1}번: 보기 잠김`, [...document.querySelectorAll("#보기목록 button")].every(b => b.disabled));
    확인(`${번 + 1}번: 정답 보기 강조`, document.querySelectorAll("#보기목록 button.정답").length === 1);
    // 연타·재선택: 점수가 두 번 오르면 안 된다
    const 전점수 = 상태.점수;
    채점하기(정답위치);
    채점하기(0);
    확인(`${번 + 1}번: 연타해도 한 번만 채점`, 상태.점수 === 전점수);
    확인(`${번 + 1}번: 마지막 버튼 글자`, document.getElementById("다음버튼").textContent === (번 === 문항수 - 1 ? "결과 보기" : "다음"));
    document.getElementById("다음버튼").click();
  }
  확인("결과 화면으로 이동", 보이는화면().join() === "화면-결과");
  확인("결과 점수 7 / 10", document.getElementById("결과점수").textContent === "7 / 10");
  확인("결과에 기록 안 됨 문구", document.getElementById("결과안내").hidden === false && document.getElementById("결과안내").textContent.includes("순위표에 기록되지 않음"));

  document.getElementById("다시하기버튼").click();
  확인("다시 하기: 같은 카테고리 새 판", 상태.카테고리 === "과학" && 상태.현재번호 === 0 && 상태.점수 === 0);
  document.getElementById("그만하기버튼").click();
  확인("그만하기: 시작 화면", 보이는화면().join() === "화면-시작");
  확인("그만하기: 점수 초기화", 상태.점수 === 0 && 상태.출제목록.length === 0);

  document.querySelectorAll("#카테고리버튼들 button")[0].click();
  for (let 번 = 0; 번 < 문항수; 번++) {
    const 정답위치 = 상태.출제목록[상태.현재번호].보기.findIndex(b => b.정답여부);
    document.querySelectorAll("#보기목록 button")[정답위치].click();
    document.getElementById("다음버튼").click();
  }
  확인("모두 정답이면 10 / 10", document.getElementById("결과점수").textContent === "10 / 10");
  document.getElementById("처음으로버튼").click();
  확인("처음으로: 시작 화면", 보이는화면().join() === "화면-시작");

  document.querySelectorAll("#카테고리버튼들 button")[1].click();
  for (let 번 = 0; 번 < 문항수; 번++) {
    const 정답위치 = 상태.출제목록[상태.현재번호].보기.findIndex(b => b.정답여부);
    document.querySelectorAll("#보기목록 button")[(정답위치 + 1) % 4].click();
    document.getElementById("다음버튼").click();
  }
  확인("모두 오답이면 0 / 10", document.getElementById("결과점수").textContent === "0 / 10");
  document.getElementById("처음으로버튼").click();

  return 실패;
})()
```

기대: 첫 줄 `확인` 단계에서 `상태 is not defined` 등의 오류(실패).

- [ ] **Step 2: ③ 상태, ⑤ 화면 그리기, ⑥ 이벤트 구현** — `script.js` 맨 아래에 이어 붙인다

```js
// ③ 상태 ------------------------------------------------------------
const 상태 = {};

function 상태초기화() {
  상태.모드 = "연습";
  상태.카테고리 = null;
  상태.출제목록 = [];
  상태.현재번호 = 0;
  상태.점수 = 0;
  상태.오답목록 = [];         // 틀린 출제 문항 (2단계 다시 풀기에서 사용)
  상태.힌트사용 = false;      // 문항마다 초기화
  상태.해설중 = false;        // 선택과 시간 초과가 겹쳐도 한 번만 처리하는 안전장치
  상태.마감시각 = null;       // 스피드용
  상태.타이머 = null;         // 스피드용
  상태.다시풀기중 = false;
  상태.다시풀기정답수 = 0;
}

function 현재문항() {
  return 상태.출제목록[상태.현재번호];
}

// ⑤ 화면 그리기 -----------------------------------------------------
function 화면보이기(이름) {
  document.querySelectorAll("main > section").forEach(구역 => {
    구역.hidden = 구역.id !== `화면-${이름}`;
  });
}

function 시작화면그리기() {
  const 자리 = document.getElementById("카테고리버튼들");
  자리.replaceChildren(...카테고리목록.map(카테고리 => {
    const 버튼 = document.createElement("button");
    버튼.type = "button";
    버튼.textContent = 카테고리;
    버튼.addEventListener("click", () => 카테고리선택(카테고리));
    return 버튼;
  }));
  화면보이기("시작");
}

function 오류화면그리기(오류목록) {
  document.getElementById("오류목록").replaceChildren(...오류목록.map(문장 => {
    const 항목 = document.createElement("li");
    항목.textContent = 문장;
    return 항목;
  }));
  화면보이기("오류");
}

function 문제그리기() {
  const 문항 = 현재문항();
  document.getElementById("문제카테고리").textContent = `${상태.카테고리} · ${상태.모드}`;
  document.getElementById("문제진행").textContent = `${상태.현재번호 + 1} / ${상태.출제목록.length}`;
  점수그리기();
  document.getElementById("문제문장").textContent = 문항.문제;
  document.getElementById("보기목록").replaceChildren(...문항.보기.map((보기, 위치) => {
    const 버튼 = document.createElement("button");
    버튼.type = "button";
    버튼.className = "보기";
    버튼.textContent = 보기.글;
    버튼.addEventListener("click", () => 채점하기(위치));
    return 버튼;
  }));
  document.getElementById("해설영역").hidden = true;
}

// 문제 화면 위쪽의 현재 점수. 해설이 나올 때마다 다시 그린다.
function 점수그리기() {
  document.getElementById("문제점수").textContent = `점수 ${점수글(상태.모드, 상태.점수)}`;
}

// 고른위치가 null이면 시간 초과. 획득점수가 null이면 점수 줄을 숨긴다.
function 해설보이기(고른위치, 맞힘, 획득점수) {
  const 문항 = 현재문항();
  document.querySelectorAll("#보기목록 button").forEach((버튼, 위치) => {
    버튼.disabled = true;
    if (문항.보기[위치].정답여부) {
      버튼.classList.add("정답");
      버튼.append(" — 정답");
    } else if (위치 === 고른위치) {
      버튼.classList.add("오답");
      버튼.append(" — 내가 고른 오답");
    }
  });

  const 정오 = document.getElementById("정오표시");
  정오.className = 맞힘 ? "맞음" : "틀림";
  정오.textContent = 맞힘 ? "정답입니다!" : (고른위치 === null ? "시간 초과! 오답으로 처리됩니다." : "틀렸습니다.");

  const 점수줄 = document.getElementById("획득점수줄");
  점수줄.hidden = 획득점수 === null;
  if (획득점수 !== null) 점수줄.textContent = `이번 문항 점수: ${점수글(상태.모드, 획득점수)}점`;

  document.getElementById("정답안내").textContent = `정답: ${문항.보기.find(보기 => 보기.정답여부).글}`;
  document.getElementById("해설글").textContent = `해설: ${문항.해설}`;
  document.getElementById("출처글").textContent = `출처: ${문항.출처}`;

  점수그리기();
  const 마지막 = 상태.현재번호 === 상태.출제목록.length - 1;
  const 다음 = document.getElementById("다음버튼");
  다음.textContent = 마지막 ? "결과 보기" : "다음";
  document.getElementById("해설영역").hidden = false;
  다음.focus();
}

function 결과그리기() {
  const 설정 = 모드설정[상태.모드];
  document.getElementById("결과점수").textContent = `${점수글(상태.모드, 상태.점수)} / ${문항수}`;
  document.getElementById("결과안내").hidden = 설정.순위표;
  화면보이기("결과");
}

// ⑥ 이벤트와 시작 -----------------------------------------------------
function 카테고리선택(카테고리) {
  판시작("연습", 카테고리);
}

function 판시작(모드, 카테고리) {
  상태초기화();
  상태.모드 = 모드;
  상태.카테고리 = 카테고리;
  상태.출제목록 = 판만들기(카테고리);
  문제내기();
}

function 문제내기() {
  상태.해설중 = false;
  상태.힌트사용 = false;
  화면보이기("문제");
  문제그리기();
}

// 1단계에는 타이머가 없다. 2단계에서 내용이 채워진다.
function 타이머끄기() {
  if (상태.타이머 !== null) {
    clearInterval(상태.타이머);
    상태.타이머 = null;
  }
}

// 위치가 null이면 시간 초과(오답). 이미 해설 중이면 두 번째 처리는 무시한다.
function 채점하기(위치) {
  if (상태.해설중) return;
  상태.해설중 = true;
  타이머끄기();
  const 문항 = 현재문항();
  const 맞힘 = 위치 !== null && 문항.보기[위치].정답여부;
  const 획득점수 = 점수계산(상태.모드, 맞힘, 상태.힌트사용);
  상태.점수 += 획득점수;
  if (!맞힘) 상태.오답목록.push(문항);
  해설보이기(위치, 맞힘, 획득점수);
}

function 다음으로() {
  상태.현재번호 += 1;
  if (상태.현재번호 >= 상태.출제목록.length) {
    결과그리기();
  } else {
    문제내기();
  }
}

function 그만하기() {
  if (!confirm("정말 그만할까요? 이 판의 점수는 남지 않습니다.")) return;
  타이머끄기();
  상태초기화();
  시작화면그리기();
}

function 처음으로() {
  타이머끄기();
  상태초기화();
  시작화면그리기();
}

document.getElementById("다음버튼").addEventListener("click", 다음으로);
document.getElementById("그만하기버튼").addEventListener("click", 그만하기);
document.getElementById("다시하기버튼").addEventListener("click", () => 판시작(상태.모드, 상태.카테고리));
document.getElementById("처음으로버튼").addEventListener("click", 처음으로);

상태초기화();
시작화면그리기();
```

> 형식점검과 오류 화면 연결은 Task 1.3에서 `시작하기()`로 묶는다. 이 단계의 마지막 줄 `시작화면그리기()`는 Task 1.3에서 교체된다.

- [ ] **Step 3: 검사 코드를 다시 실행**

페이지를 새로고침하고 Step 1의 검사 코드를 실행한다. 기대: `[]`

- [ ] **Step 4: 화면을 눈으로 확인**

내장 브라우저로 시작 화면 → 문제 화면 → 해설 화면 → 결과 화면의 스크린샷을 찍어 글자와 색이 모두 보이는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "1단계: 한 판 진행(문제, 해설, 점수, 결과, 그만하기) 구현" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 1.3: 시작 점검과 오류 화면, 좁은 화면, 1단계 마무리

**Files:**
- Modify: `script.js` (맨 아래 시작 부분 교체)

**Interfaces:**
- Consumes: `형식점검`, `오류화면그리기`, `시작화면그리기`, `상태초기화`
- Produces: `시작하기()` — 문항 로드 여부와 형식을 점검한 뒤 시작 화면 또는 오류 화면을 보여 준다

- [ ] **Step 1: 실패하는 확인 (검토 포인트 1)**

`questions.js`를 잠시 다른 이름으로 바꾼 뒤 페이지를 연다.

```bash
mv questions.js questions.js.잠시
```

화면이 비어 있는지(시작 화면이 아님) 확인하고 콘솔에 `문항목록 is not defined` 같은 오류가 있는지 본다. 기대: 현재는 오류 안내가 없다(실패). 확인 후 **반드시 원래 이름으로 되돌린다.**

```bash
mv questions.js.잠시 questions.js
```

- [ ] **Step 2: `script.js` 맨 아래의 두 줄(`상태초기화();` `시작화면그리기();`)을 아래로 교체**

```js
function 시작하기() {
  상태초기화();
  if (typeof 문항목록 === "undefined") {
    오류화면그리기(["questions.js를 읽지 못했습니다. 파일이 index.html과 같은 폴더에 있는지, 내용에 문법 오류가 없는지 확인하세요."]);
    return;
  }
  const 오류목록 = 형식점검(문항목록);
  if (오류목록.length > 0) {
    오류화면그리기(오류목록);
  } else {
    시작화면그리기();
  }
}

시작하기();
```

- [ ] **Step 3: 오류 화면 확인**

(a) `questions.js`를 다시 잠시 다른 이름으로 바꾸고 새로고침 → "questions.js를 읽지 못했습니다" 안내가 보인다. 되돌린다.

(b) `questions.js`의 첫 문항 `해설`을 일부러 `""`로 바꾸고 새로고침 → "1번째 문항(…): 해설이 비어 있음"이 보인다. **원래대로 되돌린다.** 되돌린 뒤 아래로 변경이 없는지 확인한다.

```bash
git status --short questions.js
```

기대: 출력 없음(변경 없음).

- [ ] **Step 4: 360px 폭 확인**

내장 브라우저에서 폭을 360으로 줄인 뒤(`resize_window` width 360, height 800), 시작·문제(해설 표시 상태)·결과 화면마다 아래 코드를 실행한다.

```js
document.documentElement.scrollWidth <= window.innerWidth
```

기대: 세 화면 모두 `true`. 확인이 끝나면 `resize_window` preset `desktop`으로 되돌린다.

- [ ] **Step 5: 콘솔 오류 0건 확인**

새로고침한 뒤 한 판을 끝까지 진행하고, 콘솔 오류 메시지를 읽어 0건인지 본다 (`read_console_messages`의 `onlyErrors`).

- [ ] **Step 6: 1단계 보고와 커밋**

```bash
git add script.js
git commit -m "1단계: 시작 시 문항 점검과 오류 화면 추가" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

사용자에게 **확인한 것과 확인하지 못한 것을 구분해** 보고하고, 위 "내가 브라우저에서 직접 확인할 항목"을 직접 해 보도록 안내한다. 사용자 확인 뒤 2단계로 넘어간다.

---

# 2단계 — 스피드 모드, 힌트 모드, 틀린 문제 다시 풀기

## 만들 것

- 모드 선택 화면: 카테고리를 고르면 연습·스피드·힌트 3개와 한 줄 규칙이 나온다. 연습 항목에 "순위표에 기록되지 않음". (시작 화면의 "연습 모드 · …" 문구는 이 화면으로 옮긴다.)
- 스피드 모드: 문항마다 15초, 남은 시간 표시. 시간이 지나면 오답(0점) 처리 + 정답·해설 표시. 해설이 나오면 타이머 정지, [다음]에서 15초부터 다시. 마감 시각(`Date.now()`) 기준 계산.
- 힌트 모드: 문항마다 [힌트] 1번. 누르면 오답 2개가 지워져 보기 2개만 남음. 힌트 쓰고 맞히면 0.5점, 안 쓰고 맞히면 1점, 틀리면 0점. 점수는 `7.5 / 10` 형식.
- 연습 모드의 [틀린 문제만 다시 풀기]: 틀린 문제가 있을 때만 버튼. 끝나면 "n개 중 m개 정답", 첫 판 점수는 그대로. 반복 가능, 모두 맞히면 완료 안내.

## 완료 기준

- [ ] 카테고리를 고르면 모드 선택 화면이 나오고, 연습 항목에 "순위표에 기록되지 않음"이 표시된다.
- [ ] 스피드: 문항마다 15초가 센다. 시간이 지나면 오답 처리되고 정답과 해설이 나온다.
- [ ] 스피드: 해설이 나오면 타이머가 멈추고, [다음]을 누르면 15초부터 다시 센다.
- [ ] 힌트: 힌트 버튼은 문항마다 1번만 눌리고, 누르면 오답 2개가 사라져 보기 2개(정답 포함)만 남는다.
- [ ] 힌트: 힌트를 쓰고 맞히면 0.5점, 쓰지 않고 맞히면 1점, 틀리면 0점이고, 결과가 "7.5 / 10" 형식으로 표시된다.
- [ ] 문제 화면 위쪽에 모드 이름이 보이고(예: "과학 · 스피드"), 위쪽 점수가 힌트 모드에서는 "점수 0.5"처럼 소수 첫째 자리로 보인다.
- [ ] 연습 결과 화면에 틀린 문제가 있으면 [틀린 문제만 다시 풀기]가 보이고, 없으면 보이지 않는다.
- [ ] 다시 풀기가 끝나면 "n개 중 m개 정답"이 보이고, 첫 판 점수는 그대로이다.
- [ ] 스피드·힌트에는 [틀린 문제만 다시 풀기]가 없다.
- [ ] 1단계 완료 기준이 모두 그대로 유지된다. 콘솔 오류 0건, 360px 가로 스크롤 없음.

## 내가 브라우저에서 직접 확인할 항목

1. **모드 선택** — 카테고리를 누르면 "연습 / 스피드 / 힌트"가 나온다. 연습 항목에만 "순위표에 기록되지 않음"이 있고, 각 항목에 한 줄 규칙이 있다. 시작 화면에는 더 이상 "연습 모드 · …" 문구가 없다.
2. **스피드: 시간 초과** — 스피드를 고르고 **아무것도 누르지 말고** 15초를 기다린다. 남은 시간이 줄어들다가 0이 되면 "시간 초과" 글자와 함께 정답 보기 표시, 해설, 출처가 나온다. 해설이 나온 뒤 숫자가 더 줄지 않는다.
3. **스피드: 다음 문항** — [다음]을 누르면 15초부터 다시 센다.
4. **스피드: 선택하면 멈춤** — 다음 문제에서 5초쯤 뒤에 보기를 누르면 숫자가 그 자리에서 멈춘다.
5. **스피드: 다른 탭에 갔다 오기** — 문제가 나온 상태에서 다른 탭으로 8초쯤 갔다 오면, 숫자가 약 8초만큼 줄어 있다(멈췄다가 이어서 세지 않는다).
6. **힌트: 한 번만** — 힌트 모드에서 [힌트]를 누르면 보기 2개가 사라지고 버튼이 눌리지 않게 된다. 다음 문항에서는 다시 눌린다. 보기를 고른 뒤에는 힌트가 눌리지 않는다.
7. **힌트: 점수** — 힌트를 쓰고 맞히면 "이번 문항 점수: 0.5점", 안 쓰고 맞히면 "1.0점", 틀리면 "0.0점"이 나오고, 문제 화면 위쪽 "점수"도 같은 값만큼 바뀐다(예: "힌트" 모드의 위쪽 표시는 "과학 · 힌트", "점수 0.5"). 결과 화면이 `7.5 / 10`처럼 소수 첫째 자리로 보인다. 내가 맞힌 상황과 직접 계산한 값이 같다.
8. **다시 풀기** — 연습에서 일부러 3개를 틀린다. 결과 화면에 [틀린 문제만 다시 풀기]가 보이고, 누르면 3문제만 나온다. 끝나면 "다시 풀기: 3개 중 m개 정답"이 보이고, 위쪽 점수는 처음 그대로다.
9. **다시 풀기 반복·완료** — 또 틀린 게 남으면 버튼이 다시 보이고, 모두 맞히면 버튼 대신 "모두 맞혔어요" 안내가 나온다. 전부 맞힌 첫 판에서는 이 버튼이 아예 없다.
10. **스피드·힌트에는 다시 풀기가 없다** — 두 모드의 결과 화면에 그 버튼이 없다.
11. **[그만하기]** — 스피드 도중 [그만하기] → 확인 후 시작 화면으로 돌아와 한참 기다려도 아무 일이 없고, 새 판의 타이머는 정상 15초에서 시작한다.
12. **좁은 화면과 콘솔** — 360px 폭에서 가로 스크롤이 없고 콘솔 오류가 없다.

## 작업 (Tasks)

### Task 2.1: 모드 선택 화면

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `모드설정`, `판시작(모드, 카테고리)`, `화면보이기`
- Produces: `모드설명` 상수, `모드화면그리기(카테고리)`; `카테고리선택(카테고리)`가 모드 선택 화면으로 이동하도록 바뀜

- [ ] **Step 1: 실패하는 검사**

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  const 보이는화면 = () => [...document.querySelectorAll("main > section")].filter(s => !s.hidden).map(s => s.id);

  확인("시작 화면에 연습 문구 없음", !document.getElementById("화면-시작").textContent.includes("연습 모드 ·"));
  document.querySelectorAll("#카테고리버튼들 button")[0].click();
  확인("모드 선택 화면으로 이동", 보이는화면().join() === "화면-모드");
  const 버튼들 = [...document.querySelectorAll("#모드버튼들 button")];
  확인("모드 버튼 3개", 버튼들.length === 3);
  확인("연습에만 기록 안 됨 표시", 버튼들[0].textContent.includes("순위표에 기록되지 않음")
    && !버튼들[1].textContent.includes("순위표에 기록되지 않음")
    && !버튼들[2].textContent.includes("순위표에 기록되지 않음"));
  확인("모드마다 규칙 설명", 버튼들.every(b => b.textContent.length > 8));
  버튼들[0].click();
  확인("연습 선택 → 문제 화면", 보이는화면().join() === "화면-문제" && 상태.모드 === "연습" && 상태.카테고리 === "한국사");
  확인("문제 화면 위쪽에 카테고리 · 모드", document.getElementById("문제카테고리").textContent === "한국사 · 연습");
  window.confirm = () => true;
  document.getElementById("그만하기버튼").click();
  document.querySelectorAll("#카테고리버튼들 button")[3].click();
  document.getElementById("모드처음으로버튼").click();
  확인("모드 화면의 처음으로", 보이는화면().join() === "화면-시작");
  return 실패;
})()
```

기대: 실패 항목이 여러 개(현재는 모드 선택 화면이 없다).

- [ ] **Step 2: `index.html` 수정**

(a) 시작 화면에서 아래 줄을 **지운다.**

```html
      <p class="안내">연습 모드 · 순위표에 기록되지 않음</p>
```

(b) `<section id="화면-시작">`과 `<section id="화면-문제">` 사이에 추가한다.

```html
    <section id="화면-모드" hidden>
      <h2 id="모드제목"></h2>
      <div id="모드버튼들" class="버튼줄"></div>
      <p><button id="모드처음으로버튼" type="button">처음으로</button></p>
    </section>
```

- [ ] **Step 3: `style.css`에 덧붙이기**

```css
.모드버튼 { text-align: left; display: grid; gap: 0.25rem; }
.모드버튼 .규칙 { color: #52606d; font-size: 0.9rem; }
.모드버튼 .기록안됨 { color: var(--틀림); font-size: 0.9rem; }
```

- [ ] **Step 4: `script.js` 수정**

(a) ① 상수 블록의 `모드설정` 바로 아래에 추가:

```js
const 모드설명 = {
  연습:   "시간 제한도 힌트도 없이 편하게 풀어요. 틀린 문제만 다시 풀 수 있어요.",
  스피드: "문항마다 15초! 시간이 지나면 오답이에요.",
  힌트:   "문항마다 힌트 1번(오답 2개 지우기). 힌트를 쓰고 맞히면 0.5점이에요.",
};
```

(b) ⑤ 화면 그리기 블록의 `시작화면그리기` 아래에 추가:

```js
function 모드화면그리기(카테고리) {
  document.getElementById("모드제목").textContent = `${카테고리} — 모드를 고르세요`;
  document.getElementById("모드버튼들").replaceChildren(...Object.keys(모드설정).map(모드 => {
    const 버튼 = document.createElement("button");
    버튼.type = "button";
    버튼.className = "모드버튼";
    const 이름 = document.createElement("strong");
    이름.textContent = 모드;
    const 규칙 = document.createElement("span");
    규칙.className = "규칙";
    규칙.textContent = 모드설명[모드];
    버튼.append(이름, 규칙);
    if (!모드설정[모드].순위표) {
      const 안됨 = document.createElement("span");
      안됨.className = "기록안됨";
      안됨.textContent = "순위표에 기록되지 않음";
      버튼.append(안됨);
    }
    버튼.addEventListener("click", () => 판시작(모드, 카테고리));
    return 버튼;
  }));
  화면보이기("모드");
}
```

(c) ⑥ 이벤트의 `카테고리선택`을 교체:

```js
function 카테고리선택(카테고리) {
  모드화면그리기(카테고리);
}
```

(d) 이벤트 연결 줄(`document.getElementById("처음으로버튼")...`) 아래에 추가:

```js
document.getElementById("모드처음으로버튼").addEventListener("click", 처음으로);
```

- [ ] **Step 5: 검사 재실행 → `[]`.** 1단계 검사(Task 1.2 Step 1)는 시작이 모드 선택을 거치게 되었으므로 `document.querySelectorAll("#카테고리버튼들 button")[n].click();` 다음 줄에 `document.querySelectorAll("#모드버튼들 button")[0].click();`을 추가해서 다시 돌려 통과(`[]`)하는지 확인한다.

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js
git commit -m "2단계: 모드 선택 화면 추가" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2.2: 스피드 모드 (타이머)

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `모드설정[모드].제한시간`, `채점하기(null)`, `타이머끄기()`, `문제내기()`
- Produces: `타이머시작()`, `남은밀리초()`, `남은시간그리기()`

- [ ] **Step 1: 실패하는 검사** (검토 포인트 2·3 포함)

콘솔에서 실행한다 (최상위 `await` 사용 가능).

```js
await (async () => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  const 잠깐 = 밀리초 => new Promise(끝 => setTimeout(끝, 밀리초));
  window.confirm = () => true;
  const 타이머표시 = () => document.getElementById("타이머");

  // 스피드 시작
  document.querySelectorAll("#카테고리버튼들 button")[0].click();
  document.querySelectorAll("#모드버튼들 button")[1].click();
  확인("스피드: 타이머 보임", 타이머표시().hidden === false && 타이머표시().textContent.includes("15"));
  확인("스피드: 타이머 동작 중", 상태.타이머 !== null);

  // 시간 초과 → 오답 처리, 정답·해설 표시
  상태.마감시각 = Date.now() + 500;
  await 잠깐(900);
  확인("시간 초과: 해설 표시", 상태.해설중 === true && document.getElementById("해설영역").hidden === false);
  확인("시간 초과: 안내 글자", document.getElementById("정오표시").textContent.includes("시간 초과"));
  확인("시간 초과: 0점", 상태.점수 === 0);
  확인("시간 초과: 정답 보기 강조", document.querySelectorAll("#보기목록 button.정답").length === 1);
  확인("시간 초과: 타이머 멈춤", 상태.타이머 === null);
  const 멈춘표시 = 타이머표시().textContent;
  await 잠깐(700);
  확인("해설 중에는 시간 표시가 변하지 않음", 타이머표시().textContent === 멈춘표시);

  // 다음 → 15초부터 다시
  document.getElementById("다음버튼").click();
  확인("다음 문항: 15초부터", 타이머표시().textContent.includes("15") && 상태.타이머 !== null);

  // 선택하면 즉시 멈춤
  const 정답위치 = 현재문항().보기.findIndex(b => b.정답여부);
  document.querySelectorAll("#보기목록 button")[정답위치].click();
  확인("선택: 타이머 즉시 멈춤", 상태.타이머 === null && 상태.점수 === 1);

  // 선택과 시간 초과가 겹쳐도 한 번만 채점
  채점하기(null);
  확인("선택 뒤 시간 초과가 와도 점수 그대로", 상태.점수 === 1);

  // 시간 초과 뒤 선택이 와도 한 번만
  document.getElementById("다음버튼").click();
  채점하기(null);
  채점하기(현재문항().보기.findIndex(b => b.정답여부));
  확인("시간 초과 뒤 선택이 와도 점수 그대로", 상태.점수 === 1);

  // 그만하기 후 타이머가 남지 않음
  document.getElementById("다음버튼").click();
  const 타이머번호 = 상태.타이머;
  document.getElementById("그만하기버튼").click();
  확인("그만하기: 타이머 정리", 상태.타이머 === null && 타이머번호 !== null);

  // 연습 모드에서는 타이머 숨김
  document.querySelectorAll("#카테고리버튼들 button")[0].click();
  document.querySelectorAll("#모드버튼들 button")[0].click();
  확인("연습: 타이머 숨김", 타이머표시().hidden === true && 상태.타이머 === null);
  document.getElementById("그만하기버튼").click();

  // 결과 화면으로 가면 타이머가 없음
  document.querySelectorAll("#카테고리버튼들 button")[0].click();
  document.querySelectorAll("#모드버튼들 button")[1].click();
  for (let 번 = 0; 번 < 문항수; 번++) {
    document.querySelectorAll("#보기목록 button")[0].click();
    document.getElementById("다음버튼").click();
  }
  확인("결과 화면: 타이머 없음", 상태.타이머 === null);
  확인("스피드 결과에 기록 안 됨 문구 없음", document.getElementById("결과안내").hidden === true);
  document.getElementById("처음으로버튼").click();
  return 실패;
})()
```

기대: 실패 항목 다수 (`타이머` 요소가 없어 첫 줄에서 오류).

- [ ] **Step 2: `index.html` 수정** — `#문제문장` 바로 위에 추가

```html
      <p id="타이머" class="타이머" role="timer" hidden></p>
```

- [ ] **Step 3: `style.css`에 덧붙이기**

```css
.타이머 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.75rem; }
.타이머.급함 { color: var(--틀림); }
```

- [ ] **Step 4: `script.js` 수정**

(a) ⑤에 추가:

```js
function 남은밀리초() {
  return 상태.마감시각 - Date.now();
}

function 남은시간그리기() {
  const 표시 = document.getElementById("타이머");
  const 초 = Math.max(0, Math.ceil(남은밀리초() / 1000));
  표시.textContent = `남은 시간: ${초}초`;
  표시.classList.toggle("급함", 초 <= 5);
}
```

(b) ⑤의 `문제그리기` 함수 안, `document.getElementById("해설영역").hidden = true;` 바로 위에 추가:

```js
  document.getElementById("타이머").hidden = 모드설정[상태.모드].제한시간 === null;
```

(c) ⑥의 `타이머끄기` 위에 추가하고, `문제내기`를 교체:

```js
// 마감 시각과 현재 시각의 차이로 계산한다 (탭이 백그라운드여도 시간이 어긋나지 않음).
function 타이머시작() {
  const 제한 = 모드설정[상태.모드].제한시간;
  if (제한 === null) return;
  상태.마감시각 = Date.now() + 제한 * 1000;
  남은시간그리기();
  상태.타이머 = setInterval(() => {
    남은시간그리기();
    if (남은밀리초() <= 0) 채점하기(null);
  }, 200);
}

function 문제내기() {
  타이머끄기();
  상태.해설중 = false;
  상태.힌트사용 = false;
  화면보이기("문제");
  문제그리기();
  타이머시작();
}
```

> `채점하기`가 맨 앞에서 `상태.해설중`을 확인하고 곧바로 `타이머끄기()`를 부르므로, 선택과 시간 초과가 겹쳐도 한 번만 처리된다.

- [ ] **Step 5: 검사 재실행 → `[]`**

- [ ] **Step 6: 실제 15초 대기 확인**

페이지를 새로고침하고 스피드를 시작한 뒤 아무것도 누르지 않고 실제로 15초를 기다린다 (`computer`의 `wait`로 10초 + 6초). 시간 초과 안내와 해설이 보이는지 스크린샷으로 확인한다. 남은 시간을 직접 줄이는 위 검사만으로는 "진짜 15초"를 확인한 것이 아니므로, 이 확인은 생략하지 않는다.

- [ ] **Step 7: 커밋**

```bash
git add index.html style.css script.js
git commit -m "2단계: 스피드 모드(15초 타이머, 시간 초과 처리) 구현" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2.3: 힌트 모드

**Files:**
- Modify: `index.html`, `script.js`

**Interfaces:**
- Consumes: `점수계산`, `섞기`, `모드설정[모드].힌트`
- Produces: `지울보기고르기(출제문항) → 위치[2]`, `힌트쓰기()`

- [ ] **Step 1: 실패하는 검사**

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  window.confirm = () => true;

  // 순수 함수
  확인("힌트: 쓰고 맞힘 0.5", 점수계산("힌트", true, true) === 0.5);
  확인("힌트: 안 쓰고 맞힘 1", 점수계산("힌트", true, false) === 1);
  확인("힌트: 쓰고 틀림 0", 점수계산("힌트", false, true) === 0);
  확인("힌트: 안 쓰고 틀림 0", 점수계산("힌트", false, false) === 0);
  확인("스피드: 맞힘 1, 틀림 0", 점수계산("스피드", true, false) === 1 && 점수계산("스피드", false, false) === 0);
  확인("스피드는 힌트 표시가 와도 1", 점수계산("스피드", true, true) === 1);

  const 출제 = 판만들기("과학")[0];
  const 정답위치 = 출제.보기.findIndex(b => b.정답여부);
  let 규칙지킴 = true;
  for (let 번 = 0; 번 < 100; 번++) {
    const 지움 = 지울보기고르기(출제);
    if (지움.length !== 2 || 지움[0] === 지움[1] || 지움.includes(정답위치) || 지움.some(위 => 위 < 0 || 위 > 3)) 규칙지킴 = false;
  }
  확인("지울보기고르기 100번 모두 규칙 지킴", 규칙지킴);

  // 화면: 힌트 모드
  document.querySelectorAll("#카테고리버튼들 button")[2].click();
  document.querySelectorAll("#모드버튼들 button")[2].click();
  const 힌트버튼 = document.getElementById("힌트버튼");
  확인("힌트: 버튼 보임·활성", 힌트버튼.hidden === false && 힌트버튼.disabled === false);
  확인("힌트: 타이머 숨김", document.getElementById("타이머").hidden === true);
  힌트버튼.click();
  const 보이는보기 = () => [...document.querySelectorAll("#보기목록 button")].filter(b => !b.hidden);
  확인("힌트: 보기 2개만 남음", 보이는보기().length === 2);
  확인("힌트: 정답 포함", 현재문항().보기.map((b, 위치) => [b, 위치]).filter(([b]) => b.정답여부).every(([, 위치]) => !document.querySelectorAll("#보기목록 button")[위치].hidden));
  확인("힌트: 버튼 비활성", 힌트버튼.disabled === true);
  힌트버튼.click();
  확인("힌트: 두 번째 클릭은 효과 없음", 보이는보기().length === 2);
  const 정답버튼위치 = 현재문항().보기.findIndex(b => b.정답여부);
  document.querySelectorAll("#보기목록 button")[정답버튼위치].click();
  확인("힌트 쓰고 맞힘 = 0.5점", 상태.점수 === 0.5);
  확인("점수 줄 표시", document.getElementById("획득점수줄").textContent.includes("0.5"));
  확인("위쪽 점수 표시는 소수 첫째 자리", document.getElementById("문제점수").textContent === "점수 0.5"
    && document.getElementById("문제카테고리").textContent === "과학 · 힌트");

  // 다음 문항에서 힌트 초기화, 안 쓰고 맞히면 1점
  document.getElementById("다음버튼").click();
  확인("다음 문항: 힌트 버튼 다시 활성", 힌트버튼.disabled === false && 상태.힌트사용 === false);
  확인("다음 문항: 보기 4개 다시 보임", 보이는보기().length === 4);
  document.querySelectorAll("#보기목록 button")[현재문항().보기.findIndex(b => b.정답여부)].click();
  확인("힌트 안 쓰고 맞힘 = 1점 추가", 상태.점수 === 1.5);

  // 선택한 뒤에는 힌트가 눌리지 않음
  document.getElementById("다음버튼").click();
  document.querySelectorAll("#보기목록 button")[(현재문항().보기.findIndex(b => b.정답여부) + 1) % 4].click();
  힌트쓰기();
  확인("선택 뒤 힌트는 무시", 보이는보기().length === 4 && 상태.힌트사용 === false);
  확인("틀리면 0점", 상태.점수 === 1.5);

  // 결과 표시 형식 (나머지 7문항을 모두 힌트 없이 오답 처리)
  for (let 번 = 3; 번 < 문항수; 번++) {
    document.getElementById("다음버튼").click();
    document.querySelectorAll("#보기목록 button")[(현재문항().보기.findIndex(b => b.정답여부) + 1) % 4].click();
  }
  document.getElementById("다음버튼").click();
  확인("힌트 결과는 소수 첫째 자리", document.getElementById("결과점수").textContent === "1.5 / 10");
  document.getElementById("처음으로버튼").click();

  // 다른 모드에는 힌트 버튼이 없음
  document.querySelectorAll("#카테고리버튼들 button")[2].click();
  document.querySelectorAll("#모드버튼들 button")[0].click();
  확인("연습: 힌트 버튼 숨김", document.getElementById("힌트버튼").hidden === true);
  document.getElementById("그만하기버튼").click();
  return 실패;
})()
```

기대: 실패 (`지울보기고르기 is not defined`).

- [ ] **Step 2: `index.html` 수정** — `#보기목록` 바로 위에 추가

```html
      <p><button id="힌트버튼" type="button" hidden>힌트 (오답 2개 지우기)</button></p>
```

- [ ] **Step 3: `script.js` 수정**

(a) ② 순수 로직에 추가:

```js
// 오답 3개 중 무작위 2개의 위치를 돌려준다 (힌트용).
function 지울보기고르기(출제문항) {
  const 오답위치 = 출제문항.보기
    .map((보기, 위치) => (보기.정답여부 ? -1 : 위치))
    .filter(위치 => 위치 >= 0);
  return 섞기(오답위치).slice(0, 2);
}
```

(b) ⑤의 `문제그리기` 함수 안, `document.getElementById("해설영역").hidden = true;` 바로 위에 추가:

```js
  const 힌트버튼 = document.getElementById("힌트버튼");
  힌트버튼.hidden = !모드설정[상태.모드].힌트;
  힌트버튼.disabled = false;
```

(c) ⑥에 추가하고 이벤트 연결 줄에 한 줄 더한다:

```js
function 힌트쓰기() {
  if (!모드설정[상태.모드].힌트 || 상태.해설중 || 상태.힌트사용) return;
  상태.힌트사용 = true;
  const 버튼들 = document.querySelectorAll("#보기목록 button");
  지울보기고르기(현재문항()).forEach(위치 => { 버튼들[위치].hidden = true; });
  document.getElementById("힌트버튼").disabled = true;
}

document.getElementById("힌트버튼").addEventListener("click", 힌트쓰기);
```

- [ ] **Step 4: 검사 재실행 → `[]`**

- [ ] **Step 5: 커밋**

```bash
git add index.html script.js
git commit -m "2단계: 힌트 모드(오답 2개 지우기, 0.5점) 구현" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2.4: 연습 모드의 틀린 문제 다시 풀기

**Files:**
- Modify: `index.html`, `script.js`

**Interfaces:**
- Consumes: `상태.오답목록`, `상태.다시풀기중`, `상태.다시풀기정답수`, `모드설정[모드].다시풀기`, `섞기`
- Produces: `다시풀기판만들기(오답목록) → 출제문항[]`, `다시풀기시작()`; `채점하기`·`결과그리기`·`문제그리기`가 다시 풀기 판을 구분함

- [ ] **Step 1: 실패하는 검사**

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  window.confirm = () => true;
  const 보임 = id => document.getElementById(id).hidden === false;
  const 풀기 = (맞힘) => {
    const 정답위치 = 현재문항().보기.findIndex(b => b.정답여부);
    document.querySelectorAll("#보기목록 button")[맞힘 ? 정답위치 : (정답위치 + 1) % 4].click();
    document.getElementById("다음버튼").click();
  };

  // 순수 함수: 원본 오답목록을 건드리지 않고 문항·보기를 다시 섞음
  const 샘플 = 판만들기("과학").slice(0, 3);
  const 샘플글 = JSON.stringify(샘플);
  const 다시판 = 다시풀기판만들기(샘플);
  확인("다시풀기판만들기: 같은 문항 수", 다시판.length === 3);
  확인("다시풀기판만들기: 원본 그대로", JSON.stringify(샘플) === 샘플글);
  확인("다시풀기판만들기: 정답 1개씩", 다시판.every(m => m.보기.filter(b => b.정답여부).length === 1));

  // 화면: 오답 3개로 한 판
  document.querySelectorAll("#카테고리버튼들 button")[0].click();
  document.querySelectorAll("#모드버튼들 button")[0].click();
  for (let 번 = 0; 번 < 문항수; 번++) 풀기(번 >= 3);   // 처음 3개 틀림, 7개 맞힘
  확인("첫 판 점수 7 / 10", document.getElementById("결과점수").textContent === "7 / 10");
  확인("틀린 문제가 있으면 다시 풀기 버튼 보임", 보임("다시풀기영역"));
  확인("처음에는 다시 풀기 결과 줄 없음", !보임("다시풀기결과"));
  document.getElementById("다시풀기버튼").click();
  확인("다시 풀기: 3문항", 상태.출제목록.length === 3 && document.getElementById("문제진행").textContent === "1 / 3");
  확인("다시 풀기: 위쪽 표시와 첫 판 점수 유지", document.getElementById("문제카테고리").textContent === "한국사 · 연습 · 틀린 문제 다시 풀기"
    && document.getElementById("문제점수").textContent === "점수 7");
  풀기(true); 풀기(true); 풀기(false);                  // 2개 맞힘, 1개 틀림
  확인("다시 풀기 결과 문구", document.getElementById("다시풀기결과").textContent.includes("3개 중 2개 정답"));
  확인("첫 판 점수는 그대로", document.getElementById("결과점수").textContent === "7 / 10" && 상태.점수 === 7);
  확인("아직 틀린 문제가 남아 버튼 보임", 보임("다시풀기영역") && !보임("다시풀기완료"));

  document.getElementById("다시풀기버튼").click();
  확인("반복 다시 풀기: 1문항", 상태.출제목록.length === 1);
  풀기(true);
  확인("모두 맞히면 완료 안내", 보임("다시풀기완료") && !보임("다시풀기영역"));
  확인("완료 뒤에도 첫 판 점수 그대로", document.getElementById("결과점수").textContent === "7 / 10");
  document.getElementById("처음으로버튼").click();

  // 전부 맞히면 버튼 없음
  document.querySelectorAll("#카테고리버튼들 button")[1].click();
  document.querySelectorAll("#모드버튼들 button")[0].click();
  for (let 번 = 0; 번 < 문항수; 번++) 풀기(true);
  확인("오답 0개면 다시 풀기 버튼 없음", !보임("다시풀기영역") && !보임("다시풀기완료"));
  document.getElementById("다시하기버튼").click();
  확인("다시 하기는 새 첫 판", 상태.다시풀기중 === false && 상태.출제목록.length === 10);
  document.getElementById("그만하기버튼").click();

  // 스피드·힌트에는 다시 풀기 없음
  for (const 모드번호 of [1, 2]) {
    document.querySelectorAll("#카테고리버튼들 button")[0].click();
    document.querySelectorAll("#모드버튼들 button")[모드번호].click();
    for (let 번 = 0; 번 < 문항수; 번++) 풀기(false);
    확인(`${상태.모드}: 다시 풀기 버튼 없음`, !보임("다시풀기영역") && !보임("다시풀기완료"));
    document.getElementById("처음으로버튼").click();
  }
  return 실패;
})()
```

기대: 실패 (`다시풀기판만들기 is not defined`).

- [ ] **Step 2: `index.html` 수정** — 결과 화면의 `#결과점수` 줄 바로 아래에 추가

```html
      <p id="다시풀기결과" hidden></p>
      <div id="다시풀기영역" hidden>
        <button id="다시풀기버튼" type="button">틀린 문제만 다시 풀기</button>
      </div>
      <p id="다시풀기완료" class="맞음" hidden>틀린 문제를 모두 맞혔어요!</p>
```

- [ ] **Step 3: `script.js` 수정**

(a) ② 순수 로직에 추가:

```js
// 틀린 출제 문항으로 다시 풀 판을 만든다 (문항 순서와 보기 순서를 다시 섞는다. 원본은 그대로).
function 다시풀기판만들기(오답목록) {
  return 섞기(오답목록).map(문항 => ({ ...문항, 보기: 섞기(문항.보기) }));
}
```

(b) ⑤의 `문제그리기` 함수에서 카테고리 줄을 교체:

```js
  document.getElementById("문제카테고리").textContent =
    `${상태.카테고리} · ${상태.모드}` + (상태.다시풀기중 ? " · 틀린 문제 다시 풀기" : "");
```

(c) ⑤의 `결과그리기`를 교체:

```js
function 결과그리기() {
  const 설정 = 모드설정[상태.모드];
  document.getElementById("결과점수").textContent = `${점수글(상태.모드, 상태.점수)} / ${문항수}`;
  document.getElementById("결과안내").hidden = 설정.순위표;

  const 다시풀기결과 = document.getElementById("다시풀기결과");
  다시풀기결과.hidden = !상태.다시풀기중;
  if (상태.다시풀기중) {
    다시풀기결과.textContent = `다시 풀기: ${상태.출제목록.length}개 중 ${상태.다시풀기정답수}개 정답 (첫 판 점수는 그대로입니다)`;
  }
  const 남음 = 상태.오답목록.length > 0;
  document.getElementById("다시풀기영역").hidden = !(설정.다시풀기 && 남음);
  document.getElementById("다시풀기완료").hidden = !(설정.다시풀기 && 상태.다시풀기중 && !남음);
  화면보이기("결과");
}
```

(d) ⑥의 `채점하기`를 교체하고 `다시풀기시작`을 추가, 이벤트 연결에 한 줄 더한다:

```js
// 위치가 null이면 시간 초과(오답). 이미 해설 중이면 두 번째 처리는 무시한다.
// 다시 풀기 판은 첫 판 점수를 건드리지 않고 다시풀기정답수만 올린다.
function 채점하기(위치) {
  if (상태.해설중) return;
  상태.해설중 = true;
  타이머끄기();
  const 문항 = 현재문항();
  const 맞힘 = 위치 !== null && 문항.보기[위치].정답여부;
  let 획득점수 = null;
  if (상태.다시풀기중) {
    if (맞힘) 상태.다시풀기정답수 += 1;
  } else {
    획득점수 = 점수계산(상태.모드, 맞힘, 상태.힌트사용);
    상태.점수 += 획득점수;
  }
  if (!맞힘) 상태.오답목록.push(문항);
  해설보이기(위치, 맞힘, 획득점수);
}

function 다시풀기시작() {
  const 대상 = 상태.오답목록;
  상태.출제목록 = 다시풀기판만들기(대상);
  상태.오답목록 = [];            // 이번 다시 풀기에서 또 틀린 문항이 여기에 쌓인다
  상태.현재번호 = 0;
  상태.다시풀기중 = true;
  상태.다시풀기정답수 = 0;
  문제내기();
}

document.getElementById("다시풀기버튼").addEventListener("click", 다시풀기시작);
```

- [ ] **Step 4: 검사 재실행 → `[]`.** 이어서 Task 2.2·2.3 검사와 1단계 검사(모드 선택 한 줄을 추가한 판)를 다시 돌려 모두 `[]`인지 확인한다 (다른 기능이 깨지지 않았는지).

- [ ] **Step 5: 360px 폭·콘솔 오류 확인** (Task 1.3 Step 4·5와 같은 방식, 모드 선택 화면과 다시 풀기 결과 화면 포함)

- [ ] **Step 6: 2단계 보고와 커밋**

```bash
git add index.html script.js
git commit -m "2단계: 연습 모드 틀린 문제만 다시 풀기 구현" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

사용자에게 확인한 것과 확인하지 못한 것을 구분해 보고하고, 위 "내가 브라우저에서 직접 확인할 항목"을 해 보도록 안내한다. 사용자 확인 뒤 3단계로 넘어간다.

---

# 3단계 — 점수 저장과 순위표 (localStorage)

## 만들 것

- 스피드·힌트 결과 화면의 닉네임 입력칸(최대 10자)과 [순위표에 기록] 버튼. 비우면 "익명". 기록하지 않고 넘어갈 수도 있다. 연습 결과 화면에는 입력칸이 없다.
- 저장 로직: `순위표에넣기`(정렬·상위 10개·순위), `순위표읽기`/`순위표쓰기`(`try/catch`). 저장 키 `상식퀴즈_순위표_v1`, 목록 키 `모드|카테고리`.
- 순위표 화면: 시작 화면의 [순위표 보기]로 들어가 모드(스피드·힌트) × 카테고리(4개) = 8개 목록 중 하나를 골라 상위 10개를 본다.
- 저장소를 못 쓰거나 저장값이 깨져도 퀴즈는 정상이고 순위표 쪽에만 "순위표를 저장할 수 없음" 안내.

## 완료 기준

- [ ] 스피드·힌트 결과 화면에 닉네임 입력칸(최대 10자)과 [순위표에 기록] 버튼이 있다. 닉네임을 비우고 기록하면 "익명"으로 저장된다. 기록하지 않고 넘어갈 수도 있다.
- [ ] 연습 결과 화면에는 닉네임 입력칸이 없다.
- [ ] 순위표는 모드 × 카테고리별(스피드·힌트 × 4개 = 8개 목록)로 나뉘고, 목록마다 상위 10개만 남는다.
- [ ] 정렬은 점수가 높은 순이고, 동점이면 먼저 달성한 기록이 위에 온다.
- [ ] 10위 안에 들지 못하면 그렇게 안내하고 저장하지 않는다.
- [ ] 브라우저를 닫았다 다시 열어도 기록이 남아 있다.
- [ ] `localStorage`를 쓸 수 없거나 저장된 값이 깨져 있어도 퀴즈는 정상 동작하고, 순위표 쪽에만 "순위표를 저장할 수 없음" 같은 안내가 보인다.
- [ ] 1·2단계 완료 기준이 모두 그대로 유지된다. 콘솔 오류 0건, 360px 가로 스크롤 없음.

## 내가 브라우저에서 직접 확인할 항목

1. **연습에는 입력칸이 없다** — 연습으로 한 판을 끝낸 결과 화면에 닉네임 칸과 [순위표에 기록]이 없고, "순위표에 기록되지 않음"만 보인다.
2. **기록하기** — 스피드(또는 힌트)로 한 판을 끝낸다. 닉네임 칸에 이름을 쓰고 [순위표에 기록]을 누르면 "n위로 순위표에 기록했습니다"가 나오고 버튼이 눌리지 않게 된다(두 번 기록되지 않는다).
3. **익명** — 다른 판을 끝낸 뒤 닉네임을 **비우거나 공백만** 넣고 기록하면 순위표에 "익명"으로 나온다.
4. **10자 제한** — 닉네임 칸에 12글자를 입력하거나 붙여넣으면 10글자까지만 들어간다. `<b>굵게</b>`라고 입력해 기록하면 순위표에 태그 글자 그대로 보인다(굵게 표시되지 않는다).
5. **순위표 보기** — 시작 화면의 [순위표 보기]를 누른다. 모드와 카테고리를 바꿔 가며 보면, 방금 기록한 모드·카테고리 목록에만 기록이 있고 다른 7개 목록에는 없다.
6. **정렬** — 같은 목록에 여러 판을 기록해 점수가 높은 순으로 나오는지, 점수가 같으면 먼저 기록한 것이 위인지 본다.
7. **기록하지 않고 넘어가기** — 결과 화면에서 기록하지 않고 [처음으로]를 눌러도 아무 문제가 없다. 순위표에 그 판은 없다.
8. **새로고침·다시 열기** — 페이지를 새로고침하거나 브라우저를 완전히 닫았다 `index.html`을 다시 열어도 기록이 남아 있다.
9. **10위 밖** — (기록 11개를 만들기는 번거로우므로) 개발자 도구 콘솔에서 `순위표에넣기` 확인 코드로 갈음했음을 에이전트가 보고한다. 직접 확인하고 싶다면 한 목록에 점수가 높은 기록을 10개 쌓은 뒤 낮은 점수로 기록해 "10위 안에 들지 못해 기록하지 않았습니다"가 나오는지 본다.
10. **저장 실패** — F12 → Console에 `localStorage.setItem(순위표키, "{{")`를 입력하고 새로고침한 뒤 퀴즈를 한 판 해 본다. 퀴즈는 정상이고, 순위표 화면에만 "순위표를 저장할 수 없음" 안내가 보인다. 확인 뒤 `localStorage.removeItem(순위표키)`로 정리한다.
11. **좁은 화면과 콘솔** — 360px에서 순위표 표가 화면을 넘지 않고(가로 스크롤 없음) 콘솔 오류가 없다.

## 작업 (Tasks)

### Task 3.1: 순위표 로직 (순수 함수 + 저장소)

**Files:**
- Modify: `script.js` (① 상수, ② 순수 로직, ④ 저장소)

**Interfaces:**
- Consumes: 없음 (DOM 사용 없음)
- Produces:
  - 상수 `순위표키 = "상식퀴즈_순위표_v1"`, `순위표보관개수 = 10`, `닉네임최대길이 = 10`
  - `기록유효(기록) → boolean` — `{닉네임: 문자열, 점수: 유한한 숫자, 일시: 문자열}`인지
  - `순위표에넣기(목록, 기록) → {목록: 상위 10개(새 배열), 순위: 1~10 또는 null}` — 입력 `목록`은 바꾸지 않는다. 점수 높은 순, 동점이면 `일시`가 이른 기록이 위. 10위 밖이면 `순위`가 `null`이고 `목록`에 새 기록이 들어 있지 않다
  - `순위표읽기() → {순위표: {키: 기록[]}, 정상: boolean}` — 키가 없으면 `정상: true`, 깨졌거나 저장소를 못 쓰면 빈 순위표와 `정상: false`
  - `순위표쓰기(순위표) → boolean`

- [ ] **Step 1: 실패하는 검사** (검토 포인트 5 포함)

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  const 기록 = (닉네임, 점수, 분) => ({ 닉네임, 점수, 일시: new Date(Date.UTC(2026, 9, 9, 6, 분)).toISOString() });

  // 순위표에넣기
  let 목록 = [];
  for (let 번 = 1; 번 <= 11; 번++) 목록 = 순위표에넣기(목록, 기록(`사람${번}`, 번, 번)).목록;
  확인("11번째 기록 뒤에도 10개만 남음", 목록.length === 10);
  확인("점수 높은 순", 목록.every((r, 위치) => 위치 === 0 || 목록[위치 - 1].점수 >= r.점수));
  확인("가장 낮은 기록이 밀려남", !목록.some(r => r.닉네임 === "사람1") && 목록[0].닉네임 === "사람11");

  const 동점 = 순위표에넣기([기록("먼저", 7, 1)], 기록("나중", 7, 2));
  확인("동점이면 먼저 달성한 기록이 위", 동점.목록[0].닉네임 === "먼저" && 동점.순위 === 2);
  const 동점뒤 = 순위표에넣기([기록("나중", 7, 2)], 기록("먼저", 7, 1));
  확인("들어오는 기록이 더 이르면 그 기록이 위", 동점뒤.목록[0].닉네임 === "먼저" && 동점뒤.순위 === 1);

  const 가득 = Array.from({ length: 10 }, (_, i) => 기록(`가득${i}`, 10, i));
  const 밖 = 순위표에넣기(가득, 기록("꼴찌", 5, 30));
  확인("10위 밖이면 순위 null", 밖.순위 === null);
  확인("10위 밖이면 저장 목록에 안 들어감", 밖.목록.length === 10 && !밖.목록.some(r => r.닉네임 === "꼴찌"));
  const 동점밖 = 순위표에넣기(가득, 기록("동점꼴찌", 10, 30));
  확인("10개가 모두 같은 점수면 나중 기록은 10위 밖", 동점밖.순위 === null);
  const 안 = 순위표에넣기(가득, 기록("일등", 20, 40));
  확인("들어오면 순위 1", 안.순위 === 1 && 안.목록.length === 10);
  확인("입력 목록은 바뀌지 않음", 가득.length === 10 && 가득[0].닉네임 === "가득0");
  확인("빈 목록에 첫 기록 1위", 순위표에넣기([], 기록("첫째", 0, 1)).순위 === 1);

  // 기록유효
  확인("기록유효: 정상", 기록유효(기록("가", 3, 1)) === true);
  확인("기록유효: 거부", [null, {}, { 닉네임: 1, 점수: 3, 일시: "x" }, { 닉네임: "가", 점수: "3", 일시: "x" }, { 닉네임: "가", 점수: NaN, 일시: "x" }, { 닉네임: "가", 점수: 3 }]
    .every(값 => 기록유효(값) === false));

  // 순위표읽기/쓰기 (원래 값은 끝에 복구)
  const 원래 = localStorage.getItem(순위표키);
  try {
    localStorage.removeItem(순위표키);
    확인("읽기: 키 없으면 빈 순위표, 정상", JSON.stringify(순위표읽기()) === JSON.stringify({ 순위표: {}, 정상: true }));

    const 쓸것 = { "스피드|과학": [기록("가", 9, 1)] };
    확인("쓰기 성공", 순위표쓰기(쓸것) === true);
    확인("쓴 것을 그대로 읽음", JSON.stringify(순위표읽기()) === JSON.stringify({ 순위표: 쓸것, 정상: true }));

    const 깨짐 = [["{{", "깨진 JSON"], ["null", "null"], ["[]", "배열"], ['"글자"', "문자열"], ["12", "숫자"]];
    깨짐.forEach(([값, 이름]) => {
      localStorage.setItem(순위표키, 값);
      const 읽음 = 순위표읽기();
      확인(`읽기: ${이름}은 빈 순위표 + 정상 false`, JSON.stringify(읽음.순위표) === "{}" && 읽음.정상 === false);
    });

    localStorage.setItem(순위표키, JSON.stringify({
      "스피드|과학": "문자열",
      "힌트|과학": [기록("가", 5, 1), { 닉네임: "나", 점수: "5", 일시: "x" }, null],
    }));
    const 걸러짐 = 순위표읽기();
    확인("읽기: 목록이 배열이 아니면 버림", !("스피드|과학" in 걸러짐.순위표));
    확인("읽기: 모양이 어긋난 항목만 걸러냄", 걸러짐.순위표["힌트|과학"].length === 1 && 걸러짐.정상 === true);

    // 저장소를 못 쓰는 경우
    const 원래설정 = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("가득 참"); };
    확인("쓰기 실패해도 예외 없이 false", 순위표쓰기({}) === false);
    Storage.prototype.setItem = 원래설정;
    const 원래읽기 = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("차단됨"); };
    const 막힘 = 순위표읽기();
    확인("읽기 실패해도 예외 없이 빈 순위표 + 정상 false", JSON.stringify(막힘.순위표) === "{}" && 막힘.정상 === false);
    Storage.prototype.getItem = 원래읽기;
  } finally {
    if (원래 === null) localStorage.removeItem(순위표키); else localStorage.setItem(순위표키, 원래);
  }
  return 실패;
})()
```

기대: `ReferenceError: 순위표에넣기 is not defined` (실패).

- [ ] **Step 2: ① 상수에 추가** (`모드설명` 아래)

```js
const 순위표키 = "상식퀴즈_순위표_v1";
const 순위표보관개수 = 10;
const 닉네임최대길이 = 10;
```

- [ ] **Step 3: ② 순수 로직에 추가**

```js
function 기록유효(기록) {
  return !!기록
    && typeof 기록.닉네임 === "string"
    && Number.isFinite(기록.점수)
    && typeof 기록.일시 === "string";
}

// 점수 높은 순, 동점이면 일시가 이른(먼저 달성한) 기록이 위. 상위 10개만 남긴다.
// 입력 목록은 바꾸지 않는다. 10위 밖이면 순위는 null이고 새 기록은 목록에 들어가지 않는다.
function 순위표에넣기(목록, 기록) {
  const 정렬 = [...목록, 기록].sort((가, 나) => {
    if (나.점수 !== 가.점수) return 나.점수 - 가.점수;
    return 가.일시 < 나.일시 ? -1 : (가.일시 > 나.일시 ? 1 : 0);
  });
  const 위치 = 정렬.indexOf(기록);
  return {
    목록: 정렬.slice(0, 순위표보관개수),
    순위: 위치 < 순위표보관개수 ? 위치 + 1 : null,
  };
}
```

- [ ] **Step 4: ④ 저장소 블록 추가** (③ 상태와 ⑤ 화면 그리기 사이)

```js
// ④ 저장소 (localStorage는 항상 try/catch) --------------------------------
// 키가 없으면 정상(빈 순위표). 깨졌거나 저장소를 쓸 수 없으면 빈 순위표 + 정상 false.
function 순위표읽기() {
  try {
    const 글 = localStorage.getItem(순위표키);
    if (글 === null) return { 순위표: {}, 정상: true };
    const 값 = JSON.parse(글);
    if (값 === null || typeof 값 !== "object" || Array.isArray(값)) return { 순위표: {}, 정상: false };
    const 정리 = {};
    for (const 키 of Object.keys(값)) {
      if (Array.isArray(값[키])) 정리[키] = 값[키].filter(기록유효);
    }
    return { 순위표: 정리, 정상: true };
  } catch (오류) {
    return { 순위표: {}, 정상: false };
  }
}

function 순위표쓰기(순위표) {
  try {
    localStorage.setItem(순위표키, JSON.stringify(순위표));
    return true;
  } catch (오류) {
    return false;
  }
}
```

- [ ] **Step 5: 검사 재실행 → `[]`**

- [ ] **Step 6: 커밋**

```bash
git add script.js
git commit -m "3단계: 순위표 정렬 로직과 localStorage 읽기·쓰기 추가" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3.2: 결과 화면의 닉네임 입력과 기록

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `순위표에넣기`, `순위표읽기`, `순위표쓰기`, `모드설정[모드].순위표`, `점수글`, `닉네임최대길이`
- Produces: `닉네임정리(입력글) → 문자열`, `기록하기()`; `상태.기록완료`

- [ ] **Step 1: 실패하는 검사** (검토 포인트 4 포함)

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  window.confirm = () => true;
  const 원래 = localStorage.getItem(순위표키);
  const 풀기 = (맞힘) => {
    const 정답위치 = 현재문항().보기.findIndex(b => b.정답여부);
    document.querySelectorAll("#보기목록 button")[맞힘 ? 정답위치 : (정답위치 + 1) % 4].click();
    document.getElementById("다음버튼").click();
  };
  const 판끝내기 = (모드번호, 맞힌개수, 카테고리번호 = 0) => {
    document.querySelectorAll("#카테고리버튼들 button")[카테고리번호].click();
    document.querySelectorAll("#모드버튼들 button")[모드번호].click();
    for (let 번 = 0; 번 < 문항수; 번++) 풀기(번 < 맞힌개수);
  };
  const 닉네임칸 = () => document.getElementById("닉네임입력");
  const 기록버튼 = () => document.getElementById("기록버튼");
  const 메시지 = () => document.getElementById("기록메시지").textContent;

  try {
    localStorage.removeItem(순위표키);

    // 닉네임 정리 (순수)
    확인("닉네임정리: 공백만 → 익명", 닉네임정리("   ") === "익명" && 닉네임정리("") === "익명");
    확인("닉네임정리: 앞뒤 공백 제거", 닉네임정리("  홍길동 ") === "홍길동");
    확인("닉네임정리: 10자 초과는 자름", 닉네임정리("가나다라마바사아자차카타") === "가나다라마바사아자차");
    확인("닉네임정리: 이모지도 한 글자로 셈", Array.from(닉네임정리("😀".repeat(12))).length === 10);
    확인("닉네임정리: 태그는 글자 그대로", 닉네임정리("<b>굵게</b>") === "<b>굵게</b>".slice(0, 10));

    // 연습: 입력칸 없음
    판끝내기(0, 5);
    확인("연습: 기록 영역 숨김", document.getElementById("기록영역").hidden === true);
    document.getElementById("처음으로버튼").click();

    // 스피드: 입력칸 있음
    판끝내기(1, 6);
    확인("스피드: 기록 영역 보임", document.getElementById("기록영역").hidden === false);
    확인("스피드: 닉네임 최대 길이 속성", 닉네임칸().maxLength === 10);
    확인("스피드: 연습 문구 숨김", document.getElementById("결과안내").hidden === true);
    닉네임칸().value = "홍길동";
    기록버튼().click();
    확인("기록 성공 메시지", 메시지().includes("1위"));
    확인("기록 뒤 버튼 비활성(중복 기록 방지)", 기록버튼().disabled === true);
    기록버튼().click();
    확인("저장된 기록은 1개뿐", (순위표읽기().순위표["스피드|한국사"] || []).length === 1);
    확인("점수·닉네임 저장", 순위표읽기().순위표["스피드|한국사"][0].닉네임 === "홍길동" && 순위표읽기().순위표["스피드|한국사"][0].점수 === 6);
    document.getElementById("다시하기버튼").click();
    확인("다시 하기 뒤 기록 영역이 새로 시작됨", 상태.기록완료 === false);
    document.getElementById("그만하기버튼").click();

    // 익명 + 태그 + 긴 닉네임, 힌트 모드·다른 카테고리는 다른 목록
    판끝내기(2, 3, 2);
    닉네임칸().value = "   ";
    기록버튼().click();
    const 읽음 = 순위표읽기().순위표;
    확인("공백 닉네임은 익명으로 저장", 읽음["힌트|과학"][0].닉네임 === "익명");
    확인("힌트·과학 목록은 따로", !읽음["스피드|과학"] && 읽음["스피드|한국사"].length === 1);
    확인("힌트 점수 저장", 읽음["힌트|과학"][0].점수 === 3);
    document.getElementById("처음으로버튼").click();

    판끝내기(1, 2);
    닉네임칸().value = "<b>굵게</b><img src=x onerror=alert(1)>";
    기록버튼().click();
    const 태그기록 = 순위표읽기().순위표["스피드|한국사"].find(r => r.닉네임.startsWith("<b>"));
    확인("태그 닉네임이 10자로 잘려 글자 그대로 저장", !!태그기록 && Array.from(태그기록.닉네임).length <= 10);
    document.getElementById("처음으로버튼").click();

    // 10위 밖
    localStorage.setItem(순위표키, JSON.stringify({
      "스피드|한국사": Array.from({ length: 10 }, (_, i) => ({ 닉네임: `상위${i}`, 점수: 10, 일시: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() })),
    }));
    판끝내기(1, 4);
    기록버튼().click();
    확인("10위 밖 안내", 메시지().includes("10위 안에 들지 못해"));
    확인("10위 밖은 저장 안 됨", 순위표읽기().순위표["스피드|한국사"].every(r => r.닉네임.startsWith("상위")));
    document.getElementById("처음으로버튼").click();

    // 저장소를 못 쓸 때 퀴즈는 정상, 결과 화면에만 안내
    const 원래설정 = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("가득 참"); };
    판끝내기(2, 8, 1);
    확인("저장 불가여도 결과 점수는 정상", document.getElementById("결과점수").textContent === "8.0 / 10");
    기록버튼().click();
    확인("저장 불가 안내", 메시지().includes("순위표를 저장할 수 없음"));
    확인("저장 불가 뒤에도 버튼은 다시 누를 수 있음", 기록버튼().disabled === false);
    Storage.prototype.setItem = 원래설정;
    document.getElementById("처음으로버튼").click();
  } finally {
    if (원래 === null) localStorage.removeItem(순위표키); else localStorage.setItem(순위표키, 원래);
  }
  return 실패;
})()
```

기대: 실패 (`닉네임정리 is not defined`).

- [ ] **Step 2: `index.html` 수정** — 결과 화면의 `#결과안내` 줄 바로 아래에 추가

```html
      <div id="기록영역" hidden>
        <label for="닉네임입력">닉네임 (최대 10자, 비우면 익명)</label>
        <input id="닉네임입력" type="text" maxlength="10" autocomplete="off">
        <button id="기록버튼" type="button">순위표에 기록</button>
        <p id="기록메시지" role="status"></p>
      </div>
```

- [ ] **Step 3: `style.css`에 덧붙이기**

```css
#기록영역 { margin: 1rem 0; display: grid; gap: 0.5rem; }
input[type="text"] {
  font: inherit;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--테두리);
  border-radius: 8px;
  width: 100%;
}
```

- [ ] **Step 4: `script.js` 수정**

(a) ③의 `상태초기화`에 한 줄 추가 (`상태.다시풀기정답수 = 0;` 아래):

```js
  상태.기록완료 = false;      // 순위표에 기록했거나 10위 밖으로 안내를 마친 뒤 true
```

(b) ② 순수 로직에 추가:

```js
// 공백을 정리하고, 글자 수(이모지는 1글자)를 최대 길이로 자르고, 비었으면 "익명"을 돌려준다.
function 닉네임정리(입력글) {
  const 정리 = Array.from(String(입력글).trim()).slice(0, 닉네임최대길이).join("").trim();
  return 정리 === "" ? "익명" : 정리;
}
```

(c) ⑤의 `결과그리기` 안, `화면보이기("결과");` 바로 위에 추가:

```js
  document.getElementById("기록영역").hidden = !설정.순위표;
  document.getElementById("닉네임입력").value = "";
  document.getElementById("닉네임입력").disabled = false;
  document.getElementById("기록버튼").disabled = false;
  document.getElementById("기록메시지").textContent = "";
```

(d) ⑥에 추가하고 이벤트 연결 줄에 한 줄 더한다:

```js
function 기록하기() {
  if (상태.기록완료 || !모드설정[상태.모드].순위표) return;
  const 메시지 = document.getElementById("기록메시지");
  const 키 = `${상태.모드}|${상태.카테고리}`;
  const 읽음 = 순위표읽기();
  const 결과 = 순위표에넣기(읽음.순위표[키] || [], {
    닉네임: 닉네임정리(document.getElementById("닉네임입력").value),
    점수: 상태.점수,
    일시: new Date().toISOString(),
  });

  if (결과.순위 === null) {
    메시지.textContent = "10위 안에 들지 못해 기록하지 않았습니다.";
  } else {
    읽음.순위표[키] = 결과.목록;
    if (!순위표쓰기(읽음.순위표)) {
      메시지.textContent = "순위표를 저장할 수 없음: 이 브라우저에서 저장소를 쓸 수 없습니다. (퀴즈는 계속 할 수 있어요)";
      return;
    }
    메시지.textContent = `${결과.순위}위로 순위표에 기록했습니다.`;
  }
  상태.기록완료 = true;
  document.getElementById("기록버튼").disabled = true;
  document.getElementById("닉네임입력").disabled = true;
}

document.getElementById("기록버튼").addEventListener("click", 기록하기);
```

- [ ] **Step 5: 검사 재실행 → `[]`.** Task 2.4까지의 검사 코드도 다시 돌려 `[]`인지 확인한다 (스피드·힌트 결과 화면이 바뀌었으므로).

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js
git commit -m "3단계: 결과 화면 닉네임 입력과 순위표 기록 구현" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3.3: 순위표 화면

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `순위표읽기`, `점수글`, `모드설정`, `카테고리목록`, `순위표보관개수`
- Produces: `순위표선택채우기()`, `순위표그리기()`, `순위표열기()`, `날짜글(일시)`; 화면 이름 `순위표`

- [ ] **Step 1: 실패하는 검사**

```js
(() => {
  const 실패 = [];
  const 확인 = (이름, 조건) => { if (!조건) 실패.push(이름); };
  const 보이는화면 = () => [...document.querySelectorAll("main > section")].filter(s => !s.hidden).map(s => s.id);
  const 원래 = localStorage.getItem(순위표키);
  try {
    const 만들기 = (닉네임, 점수, 분) => ({ 닉네임, 점수, 일시: new Date(Date.UTC(2026, 9, 9, 6, 분)).toISOString() });
    localStorage.setItem(순위표키, JSON.stringify({
      "스피드|한국사": [만들기("<b>가</b>", 9, 1), 만들기("나", 7, 2)],
      "힌트|과학": [만들기("다", 7.5, 3)],
    }));

    상태초기화(); 시작화면그리기();
    확인("시작 화면에 순위표 버튼", !!document.getElementById("순위표열기버튼"));
    document.getElementById("순위표열기버튼").click();
    확인("순위표 화면으로 이동", 보이는화면().join() === "화면-순위표");

    const 모드칸 = document.getElementById("순위표모드");
    const 카테고리칸 = document.getElementById("순위표카테고리");
    확인("모드 선택은 순위표 있는 모드만(스피드·힌트)", [...모드칸.options].map(o => o.value).join() === "스피드,힌트");
    확인("카테고리 선택 4개", [...카테고리칸.options].map(o => o.value).join() === 카테고리목록.join());

    const 줄들 = () => [...document.querySelectorAll("#순위표본문 tr")].map(tr => [...tr.children].map(td => td.textContent));
    모드칸.value = "스피드"; 카테고리칸.value = "한국사"; 모드칸.dispatchEvent(new Event("change"));
    확인("스피드·한국사: 2줄, 점수 순", 줄들().length === 2 && 줄들()[0][1] === "<b>가</b>" && 줄들()[0][0] === "1" && 줄들()[1][0] === "2");
    확인("닉네임이 HTML로 해석되지 않음", document.querySelector("#순위표본문 b") === null);
    확인("스피드 점수는 정수", 줄들()[0][2] === "9");

    모드칸.value = "힌트"; 카테고리칸.value = "과학"; 카테고리칸.dispatchEvent(new Event("change"));
    확인("힌트·과학: 1줄, 소수 점수", 줄들().length === 1 && 줄들()[0][2] === "7.5");
    확인("기록이 있으면 '없음' 안내 숨김", document.getElementById("순위표비었음").hidden === true);

    카테고리칸.value = "세계지리"; 카테고리칸.dispatchEvent(new Event("change"));
    확인("기록 없는 목록은 빈 표 + 안내", 줄들().length === 0 && document.getElementById("순위표비었음").hidden === false);
    확인("정상일 때는 저장 불가 안내 숨김", document.getElementById("순위표알림").hidden === true);

    // 저장값이 깨졌을 때: 순위표 쪽에만 안내, 퀴즈는 정상
    localStorage.setItem(순위표키, "{{");
    document.getElementById("순위표닫기버튼").click();
    확인("순위표 닫기 → 시작 화면", 보이는화면().join() === "화면-시작");
    document.getElementById("순위표열기버튼").click();
    확인("깨진 값: 순위표에만 안내", document.getElementById("순위표알림").hidden === false && document.getElementById("순위표알림").textContent.includes("순위표를 저장할 수 없음"));
    확인("깨진 값: 빈 표", 줄들().length === 0);
    document.getElementById("순위표닫기버튼").click();
    document.querySelectorAll("#카테고리버튼들 button")[0].click();
    확인("깨진 값이어도 퀴즈 시작 가능", 보이는화면().join() === "화면-모드");
    document.getElementById("모드처음으로버튼").click();

    // 저장소 접근 자체가 막힌 경우
    const 원래읽기 = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("차단됨"); };
    document.getElementById("순위표열기버튼").click();
    확인("저장소 차단: 순위표 안내", document.getElementById("순위표알림").hidden === false);
    Storage.prototype.getItem = 원래읽기;
    document.getElementById("순위표닫기버튼").click();

    // 날짜 표시
    확인("날짜글: 잘못된 값은 -", 날짜글("엉터리") === "-");
    확인("날짜글: 정상 값은 비어 있지 않음", 날짜글(new Date().toISOString()).length > 3);
  } finally {
    if (원래 === null) localStorage.removeItem(순위표키); else localStorage.setItem(순위표키, 원래);
  }
  return 실패;
})()
```

기대: 실패 (`순위표열기버튼`이 없어 `click` 오류).

- [ ] **Step 2: `index.html` 수정**

(a) 시작 화면의 `#카테고리버튼들` 아래에 추가:

```html
      <p><button id="순위표열기버튼" type="button">순위표 보기</button></p>
```

(b) `<section id="화면-결과">`와 `<section id="화면-오류">` 사이에 추가:

```html
    <section id="화면-순위표" hidden>
      <h2>순위표</h2>
      <div class="선택줄">
        <label>모드 <select id="순위표모드"></select></label>
        <label>카테고리 <select id="순위표카테고리"></select></label>
      </div>
      <p id="순위표알림" class="틀림" hidden>순위표를 저장할 수 없음: 저장소를 쓸 수 없거나 저장된 값이 깨져 있어 빈 순위표를 보여 줍니다.</p>
      <table>
        <thead><tr><th>순위</th><th>닉네임</th><th>점수</th><th>날짜</th></tr></thead>
        <tbody id="순위표본문"></tbody>
      </table>
      <p id="순위표비었음" class="안내" hidden>아직 기록이 없습니다.</p>
      <p><button id="순위표닫기버튼" type="button">처음으로</button></p>
    </section>
```

- [ ] **Step 3: `style.css`에 덧붙이기**

```css
.선택줄 { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
select { font: inherit; min-height: 44px; padding: 0.25rem 0.5rem; border: 1px solid var(--테두리); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 0.4rem 0.3rem; border-bottom: 1px solid var(--테두리); text-align: left; overflow-wrap: anywhere; font-size: 0.95rem; }
th:nth-child(1), td:nth-child(1) { width: 3.5rem; }
th:nth-child(3), td:nth-child(3) { width: 4rem; }
```

- [ ] **Step 4: `script.js` 수정**

(a) ⑤에 추가:

```js
function 날짜글(일시) {
  const 날짜 = new Date(일시);
  if (Number.isNaN(날짜.getTime())) return "-";
  return 날짜.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

// 순위표를 볼 수 있는 모드와 카테고리 목록을 선택칸에 채운다 (시작할 때 한 번).
function 순위표선택채우기() {
  const 칸채우기 = (칸, 값들) => {
    칸.replaceChildren(...값들.map(값 => {
      const 선택 = document.createElement("option");
      선택.value = 값;
      선택.textContent = 값;
      return 선택;
    }));
  };
  칸채우기(document.getElementById("순위표모드"), Object.keys(모드설정).filter(모드 => 모드설정[모드].순위표));
  칸채우기(document.getElementById("순위표카테고리"), 카테고리목록);
}

function 순위표그리기() {
  const 모드 = document.getElementById("순위표모드").value;
  const 카테고리 = document.getElementById("순위표카테고리").value;
  const 읽음 = 순위표읽기();
  const 목록 = (읽음.순위표[`${모드}|${카테고리}`] || []).slice(0, 순위표보관개수);

  document.getElementById("순위표알림").hidden = 읽음.정상;
  document.getElementById("순위표비었음").hidden = 목록.length > 0;
  document.getElementById("순위표본문").replaceChildren(...목록.map((기록, 순번) => {
    const 줄 = document.createElement("tr");
    [순번 + 1, 기록.닉네임, 점수글(모드, 기록.점수), 날짜글(기록.일시)].forEach(값 => {
      const 칸 = document.createElement("td");
      칸.textContent = 값;     // textContent라서 닉네임의 태그가 HTML로 해석되지 않는다
      줄.append(칸);
    });
    return 줄;
  }));
}
```

(b) ⑤의 `시작화면그리기`에서 마지막 줄 `화면보이기("시작");` 바로 위에는 변경이 없다. ⑥에 추가하고 이벤트 연결 줄에 더한다:

```js
function 순위표열기() {
  순위표그리기();
  화면보이기("순위표");
}

document.getElementById("순위표열기버튼").addEventListener("click", 순위표열기);
document.getElementById("순위표닫기버튼").addEventListener("click", 처음으로);
document.getElementById("순위표모드").addEventListener("change", 순위표그리기);
document.getElementById("순위표카테고리").addEventListener("change", 순위표그리기);
```

(c) `시작하기` 함수 안, `상태초기화();` 바로 아래에 한 줄 추가:

```js
  순위표선택채우기();
```

- [ ] **Step 5: 검사 재실행 → `[]`**

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js
git commit -m "3단계: 순위표 화면(8개 목록, 상위 10개) 구현" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3.4: 전체 회귀 검증과 마무리

**Files:**
- 변경 없음이 목표 (문제가 나오면 해당 Task의 파일을 고친다)

- [ ] **Step 1: 모든 검사 코드를 순서대로 다시 실행**

새로고침 후 Task 1.1 → 1.2 → 2.1(1단계 검사의 모드 선택 한 줄 추가판) → 2.2 → 2.3 → 2.4 → 3.1 → 3.2 → 3.3 검사 코드를 차례로 실행한다. 모두 `[]`여야 한다. 하나라도 실패하면 원인을 고치고(`superpowers:systematic-debugging`) 전체를 다시 돌린다.

- [ ] **Step 2: 영속성 확인 (닫았다 다시 열기)**

스피드로 한 판을 끝내고 기록한 뒤, 탭을 닫았다가 `file:///C:/학교과제/Study03_Quiz/index.html`을 다시 열어 순위표에 기록이 남아 있는지 본다. 테스트로 만든 기록은 콘솔에서 `localStorage.removeItem(순위표키)`로 지운다.

- [ ] **Step 3: 공통 기준 확인 (PRD 9.4)**

- 콘솔 오류 0건 (한 판 풀기 + 순위표 열기까지 진행한 뒤 `read_console_messages`의 `onlyErrors`).
- 화면마다 폭 360px에서 `document.documentElement.scrollWidth <= window.innerWidth` → `true` (시작, 모드 선택, 문제+해설, 결과(기록 영역 포함), 순위표). 끝난 뒤 `resize_window` preset `desktop`.
- 외부 요청이 없는지 `read_network_requests`로 확인 (4개 파일 외 요청 0건).
- Chrome이나 Edge로 `file://` 더블클릭 동작은 **에이전트가 직접 확인할 수 없으므로** 사용자 확인 항목으로 넘긴다. Firefox는 확인하지 못했다면 못 했다고 보고한다.

- [ ] **Step 4: 파일 구성 확인**

```bash
ls
git status --short
```

기대: 프로젝트 폴더의 앱 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개뿐이고(문서 `PRD.md`, `IMPL-PLAN.md`, `docs/` 제외), 커밋되지 않은 변경이 없다.

- [ ] **Step 5: 3단계 보고**

사용자에게 확인한 것과 확인하지 못한 것을 구분해 보고하고 "내가 브라우저에서 직접 확인할 항목"을 안내한다. 푸시·배포는 하지 않는다 (요청이 있을 때만).

---

## 자체 검토

**PRD 대응**

| PRD 항목 | 담당 작업 |
|---|---|
| 5.1 문항 형식 + 시작 시 점검, 8.4 형식 오류 시 오류 화면 | 1.1 (`형식점검`), 1.3 (오류 화면) |
| 2장 공통 동작 (한 번만 선택, 해설, 그만하기, 무작위 순서) | 1.1 (`섞기`, `판만들기`), 1.2 |
| 3.1 연습, 4.1 완료 기준 | 1.2, 1.3 |
| 3.2 스피드, 8.4 타이머·동시 발생 | 2.2 |
| 3.3 힌트, `지울보기고르기`, 소수 점수 | 1.1 (`점수글`), 2.3 |
| 3.4 틀린 문제 다시 풀기 | 2.4 |
| 모드 선택 화면(2단계) | 2.1 |
| 5.2 순위표 데이터, 8.2 `순위표에넣기`, 4.3 | 3.1, 3.2, 3.3 |
| 8.4 `localStorage` 실패 | 3.1 (읽기·쓰기), 3.2 (결과 화면 안내), 3.3 (순위표 화면 안내) |
| 7장 기술 조건, 9.4 공통 | 전역 제약, 1.3, 3.4 |

**함수 이름 일관성:** `섞기`, `출제문항만들기`, `판만들기`, `점수계산`, `점수글`, `형식점검`, `지울보기고르기`, `다시풀기판만들기`, `기록유효`, `순위표에넣기`, `닉네임정리`, `순위표읽기`, `순위표쓰기`, `채점하기(위치)`(null = 시간 초과), `해설보이기(고른위치, 맞힘, 획득점수)`, `타이머시작`/`타이머끄기`, `다시풀기시작`, `기록하기`, `순위표열기`/`순위표그리기`, `시작하기`. 상태 필드는 `상태초기화`에서 한 번에 정의했고 `기록완료`만 3단계에서 추가한다.

## 이 계획서가 정한 사항 (PRD가 명시하지 않아 결정한 것 — 틀리면 알려 주세요)

- **문제 화면 위쪽 표시:** PRD 2장은 문제 화면에 "카테고리, 진행"만 적었지만, 이 계획서는 "카테고리 · 모드"(예: 한국사 · 연습)와 현재 점수(예: 점수 0)를 더 보여 준다. 노트 5.2.3.2의 예시("한국사 · 연습", "1 / 10", "점수 0")에 맞춘 것이다. 다시 풀기 판에서는 첫 판 점수가 그대로 보이고 모드 뒤에 " · 틀린 문제 다시 풀기"가 붙는다. PRD 2장의 문제 화면 행에도 같은 내용을 넣을지는 사용자가 정한다.
- **힌트 모드의 점수 표시:** 점수가 정수여도 항상 소수 첫째 자리로 보여 준다 (예: `8.0 / 10`). PRD의 "소수 첫째 자리까지 표시한다"를 힌트 모드 전체에 적용한 해석이다.
- **모드 선택 화면의 [처음으로] 버튼:** PRD에 없지만, 카테고리를 잘못 골랐을 때 새로고침 말고 돌아갈 길이 없어 넣었다.
- **시간 초과 표시:** 문항 점수 줄에 "이번 문항 점수: n점"을 모든 모드에서 보여 준다 (힌트 모드의 0.5점이 눈에 보이도록).
- **다시 풀기 결과 화면:** 위쪽에 첫 판 점수를 그대로 두고, 그 아래에 "다시 풀기: n개 중 m개 정답"을 한 줄 더 보여 준다.
- **순위표 기록 후:** 같은 결과를 두 번 기록하지 못하게 버튼과 입력칸을 잠근다. 저장소 오류로 저장하지 못했을 때는 잠그지 않아 다시 시도할 수 있다.
- **10위 밖:** 안내만 하고 저장하지 않으며 같은 결과를 다시 기록하려 시도할 수 없다.
- **이모지 닉네임:** `maxlength`는 이모지를 2글자로 세므로, 저장 직전에 코드 포인트 기준 10글자로 한 번 더 자른다.
