/*************************************************************************
 * 실제 운영 환경에서는 프론트엔드에 API Key를 절대 노출하면 안 됩니다!
 * 여기서는 학습/테스트 편의를 위해 하드코딩 예시를 보여드립니다.
 *************************************************************************/
const OPENAI_API_KEY = "sk-여기에-본인-실제-API키를-넣으세요";

/**
 * "목표별 할 일 8개 생성하기" 버튼 클릭 → 각 목표(중앙 차트 8칸)에 대해 GPT 호출,
 * 해당 목표를 중심으로 하는 서브 차트에 '할 일 8개'를 채워넣습니다.
 */
async function generateTasks() {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = "GPT가 할 일을 생성 중입니다. 잠시만 기다려주세요...";

  // 중앙(5번 차트)의 모든 칸 가져오기
  const centerChartCells = [];
  for (let i = 1; i <= 9; i++) {
    centerChartCells[i] = document.querySelector(`#subChart5Cell${i} input`);
  }

  // 중앙칸(#5)에 적힌 "메인 비전"
  const mainVision = centerChartCells[5].value.trim();
  if (!mainVision) {
    alert("정중앙(메인 비전)을 입력하세요!");
    statusEl.textContent = "";
    return;
  }

  // 8개 목표 (주변칸: #1,#2,#3,#4,#6,#7,#8,#9)
  const goals = [];
  const goalCellIndices = [1,2,3,4,6,7,8,9];
  goalCellIndices.forEach((idx) => {
    const goalText = centerChartCells[idx].value.trim() || `목표${idx}(미입력)`;
    goals.push({
      cellIndex: idx, // 중앙차트에서의 위치
      text: goalText,
    });
  });

  // 각 목표에 대해 GPT로 '할 일' 생성하고, 해당 서브 차트에 반영
  for (const g of goals) {
    try {
      const tasks = await requestGptForGoal(mainVision, g.text);
      // g.cellIndex에 해당하는 서브차트(1번~9번 중 하나)의 중앙 칸에 목표를 적고,
      // 나머지 8칸에 할 일을 표시
      fillSubChart(g.cellIndex, g.text, tasks);
    } catch (err) {
      console.error(err);
      // 실패시 서브차트에 에러 표시
      fillSubChart(g.cellIndex, g.text, [
        `❌ 할 일 생성 실패: ${err.message}`,
      ]);
    }
  }

  statusEl.textContent = "생성 완료!";
}

/**
 * OpenAI ChatCompletion을 통해 목표에 대한 '할 일' 8개를 생성
 */
async function requestGptForGoal(mainVision, goalText) {
  const prompt = `
다음은 내가 이루고자 하는 메인 비전입니다: "${mainVision}"
이를 달성하기 위한 구체적인 목표 중 하나: "${goalText}"

목표 "${goalText}"를 달성하기 위해 도움이 될 만한 구체적인 '할 일' 8개를,
"1) ~, 2) ~" 형식으로 짧게 작성해주세요.
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API 에러: ${response.status} / ${response.statusText}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message.content.trim();
  // 간단히 줄바꿈 기준으로 분할
  const lines = assistantMessage.split("\n").map((line) => line.trim());
  return lines.filter((line) => line); // 빈 줄 제거
}

/**
 * 특정 목표를 담당하는 서브 차트(1~4,6~9번)의
 * 중앙 칸(#5)에 목표를 적고, 주변 8칸(#1,#2,#3,#4,#6,#7,#8,#9)에 GPT 결과를 채워넣는다.
 *
 * @param {Number} chartIndex - subChart# (1..9). 5는 중앙 차트이므로 여기서는 제외.
 * @param {String} goalText
 * @param {Array<String>} tasks - GPT가 생성한 할 일 목록
 */
function fillSubChart(chartIndex, goalText, tasks) {
  // 서브 차트 DOM 가져오기
  const chartEl = document.getElementById(`subChart${chartIndex}`);
  if (!chartEl) return; // 없으면 스킵

  // 중앙 칸(#5)에 목표 텍스트 표시
  const centerCell = chartEl.querySelector(`#subChart${chartIndex}Cell5`);
  if (centerCell) {
    centerCell.textContent = goalText;
    centerCell.classList.add("center");
  }

  // 나머지 8칸 (#1,#2,#3,#4,#6,#7,#8,#9)에 '할 일' 표시
  const otherCells = [1,2,3,4,6,7,8,9].filter((v) => v !== 5);
  for (let i = 0; i < otherCells.length; i++) {
    const cellId = `subChart${chartIndex}Cell${otherCells[i]}`;
    const cellEl = chartEl.querySelector(`#${cellId}`);
    if (!cellEl) continue;

    // 해당 인덱스의 할 일 문구가 있으면 표시, 없으면 빈 칸
    const taskText = tasks[i] || "";
    cellEl.textContent = taskText;
  }
}

// 버튼 이벤트 등록
document.getElementById("generateBtn").addEventListener("click", generateTasks);
