/*************************************************************************
 * 프론트엔드에 API Key를 직접 넣는 것은 보안에 매우 취약합니다.
 * 여기서는 테스트 편의를 위해 하드코딩 예시를 보여드립니다.
 * 실제로는 서버 사이드에서 OpenAI API를 호출하시기 바랍니다.
 *************************************************************************/

/* 
Github에 저장된 API Key 불러오기.
 */

async function getApiKey() {
  try {
    const response = await fetch("config.json");
    const data = await response.json();
    return data.OPENAI_API_KEY;
  } catch (error) {
    console.error("Failed to fetch API key:", error);
    return null;
  }
}
/**
 * "목표별 할 일 8개 생성하기" 버튼 클릭 시 실행
 * - 중앙(5번) 차트에서 메인 비전과 8개 목표를 읽음
 * - 각 목표를 GPT에게 보냄
 * - 해당 목표에 해당하는 서브 차트(1,2,3,4,6,7,8,9)에 할 일 8개를 배치
 */
async function generateTasks() {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = "GPT가 할 일을 생성 중입니다. 잠시만 기다려주세요...";

  // 중앙 차트 #5에서 입력값을 가져온다
  const centerChartInputs = [];
  for (let i = 1; i <= 9; i++) {
    const inputEl = document.querySelector(`#subChart5Cell${i} input`);
    centerChartInputs[i] = inputEl ? inputEl.value.trim() : "";
  }

  // #5의 중앙칸은 메인 비전
  const mainVision = centerChartInputs[5];
  if (!mainVision) {
    alert("정중앙(#5)에 메인 비전을 입력하세요!");
    statusEl.textContent = "";
    return;
  }

  // #5 차트의 나머지 8칸 (#1,#2,#3,#4,#6,#7,#8,#9)은 목표
  const goalIndices = [1, 2, 3, 4, 6, 7, 8, 9];
  const goals = goalIndices.map((idx) => {
    return { index: idx, text: centerChartInputs[idx] || `목표${idx}(미입력)` };
  });

  // 각 목표에 대해 GPT API 호출 → 서브 차트에 표시
  for (let i = 0; i < goals.length; i++) {
    const { index, text } = goals[i];
    try {
      const tasks = await requestGptForGoal(mainVision, text);
      fillSubChart(index, text, tasks);
    } catch (error) {
      console.error(error);
      fillSubChart(index, text, [`❌ 할 일 생성 실패: ${error.message}`]);
    }
  }

  statusEl.textContent = "생성 완료!";
}

/**
 * GPT에게 "목표 달성을 위한 할 일 8개"를 생성해 달라고 요청
 */
async function requestGptForGoal(vision, goal) {
  /* API Key 불러오기. 이후 apiKey 이용해서 사용. */
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing or invalid");
  }

  const prompt = `
다음은 내가 이루고자 하는 메인 비전입니다: "${vision}"
이를 달성하기 위한 목표 중 하나: "${goal}"

목표 "${goal}"를 달성하기 위해 도움이 될 만한 '할 일' 8개를,
1) 형식으로 짧게 제시해 주세요.
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API 에러: ${response.status} - ${response.statusText}`
    );
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message.content.trim();

  // 단순히 줄바꿈 기준으로 분리
  const lines = assistantMessage.split("\n").map((line) => line.trim());
  return lines.filter((line) => line); // 빈 줄 제거
}

/**
 * 특정 목표에 대한 "할 일 8개"를 해당 서브 차트(1~4,6~9)의 중앙 칸(#5) & 주변 칸에 반영
 * - 중앙 칸(#5)은 목표명
 * - 나머지 8칸(#1,#2,#3,#4,#6,#7,#8,#9)에 할 일 목록
 */
function fillSubChart(chartIndex, goalText, tasks) {
  const chartEl = document.getElementById(`subChart${chartIndex}`);
  if (!chartEl) return;

  // 중앙 칸(#5)에 목표 텍스트
  const centerCell = chartEl.querySelector(`#subChart${chartIndex}Cell5`);
  if (centerCell) {
    centerCell.textContent = goalText;
    centerCell.classList.add("center");
  }

  // 주변 8칸
  const surroundingCells = [1, 2, 3, 4, 6, 7, 8, 9].filter((i) => i !== 5);
  surroundingCells.forEach((cellNum, i) => {
    const cellId = `subChart${chartIndex}Cell${cellNum}`;
    const cell = chartEl.querySelector(`#${cellId}`);
    if (cell) {
      cell.textContent = tasks[i] || "";
    }
  });
}

// 버튼에 이벤트 연결
document.getElementById("generateBtn").addEventListener("click", generateTasks);
