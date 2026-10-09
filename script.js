// ① 상수 ------------------------------------------------------------
const 카테고리목록 = ["한국사", "세계지리", "과학", "예술과 문화"];
const 문항수 = 10;

// 화면·이벤트 코드는 모드 이름으로 if를 가르지 않고 이 값만 본다.
const 모드설정 = {
  연습:   { 제한시간: null, 힌트: false, 맞힘점수: 1, 힌트후점수: null, 순위표: false, 다시풀기: true },
  스피드: { 제한시간: 15,   힌트: false, 맞힘점수: 1, 힌트후점수: null, 순위표: true,  다시풀기: false },
  힌트:   { 제한시간: null, 힌트: true,  맞힘점수: 1, 힌트후점수: 0.5,  순위표: true,  다시풀기: false },
};

const 모드설명 = {
  연습:   "시간 제한도 힌트도 없이 편하게 풀어요. 틀린 문제만 다시 풀 수 있어요.",
  스피드: "문항마다 15초! 시간이 지나면 오답이에요.",
  힌트:   "문항마다 힌트 1번(오답 2개 지우기). 힌트를 쓰고 맞히면 0.5점이에요.",
};

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

function 남은밀리초() {
  return 상태.마감시각 - Date.now();
}

function 남은시간그리기() {
  const 표시 = document.getElementById("타이머");
  const 초 = Math.max(0, Math.ceil(남은밀리초() / 1000));
  표시.textContent = `남은 시간: ${초}초`;
  표시.classList.toggle("급함", 초 <= 5);
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
  document.getElementById("타이머").hidden = 모드설정[상태.모드].제한시간 === null;
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
  모드화면그리기(카테고리);
}

function 판시작(모드, 카테고리) {
  상태초기화();
  상태.모드 = 모드;
  상태.카테고리 = 카테고리;
  상태.출제목록 = 판만들기(카테고리);
  문제내기();
}

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
document.getElementById("모드처음으로버튼").addEventListener("click", 처음으로);

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
