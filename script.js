/************************************************************
 * 경고: 실제 서비스에서는 프론트엔드에 API Key를 노출하면 안 됩니다!
 * 여기서는 테스트/학습용 예시로만 사용하세요.
 ************************************************************/
const OPENAI_API_KEY = "sk-여기에-본인-실제-API키를-넣으세요";

/**
 * "목표별 할 일 8개 생성하기" 버튼 클릭시 실행되는 함수
 * - 1번 비전(가운데)을 확인
 * - 2~9번 목표를 순회하며, GPT에게 할 일 목록을 요청
 * - 각 목표 칸에 결과를 표시
 */
async function generateTasks() {
  const vision = document.getElementById("vision").value.trim();
  if (!vision) {
    alert("1번 비전(가운데)를 입력해주세요!");
    return;
  }

  // 2~9번 목표 수집
  const goals = [];
  for (let i = 2; i <= 9; i++) {
    const goalValue = document.getElementById(`goal${i}`).value.trim();
    goals.push({
      index: i,
      text: goalValue || `목표${i} (미입력)`,
    });
  }

  // 상태 표시
  const statusMessageEl = document.getElementById("statusMessage");
  statusMessageEl.textContent = "GPT가 할 일을 생성 중입니다. 잠시 기다려주세요...";

  // 각 목표마다 GPT에 요청 후 표시
  for (const goalObj of goals) {
    try {
      const tasks = await requestGptForGoal(vision, goalObj.text);
      displayTasks(goalObj.index, tasks);
    } catch (err) {
      console.error(err);
      displayTasks(goalObj.index, [`❌ 할 일 생성 실패: ${err.message}`]);
    }
  }

  statusMessageEl.textContent = "생성 완료!";
}

/**
 * 특정 목표에 대해 GPT에 "할 일 8개"를 물어보고 결과 문자열 배열을 반환
 */
async function requestGptForGoal(vision, goalText) {
  const prompt = `
다음은 내가 이루고자 하는 비전입니다: "${vision}"
이를 달성하기 위한 구체적인 목표 중 하나: "${goalText}"

목표 "${goalText}"를 달성하기 위해 도움이 될 만한 구체적인 '할 일' 8개를, 
1) 형식으로 제시해주세요. 예)
1) ...
2) ...
...
`;

  // OpenAI ChatCompletion API 호출
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
    throw new Error(`OpenAI API 에러: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message.content.trim();
  
  // 줄바꿈 기준으로 분할 (GPT가 "1) ~\n2) ~\n..." 형태로 응답한다고 가정)
  const lines = assistantMessage.split("\n").map(line => line.trim());
  // 불필요한 빈 문자열 제거
  return lines.filter(line => line);
}

/**
 * 생성된 할 일 배열을 해당 목표 셀 내의 <ul>에 표시
 */
function displayTasks(goalIndex, tasks) {
  const ulEl = document.getElementById(`tasks${goalIndex}`);
  if (!ulEl) return;

  // 기존 리스트 초기화
  ulEl.innerHTML = "";

  // 새 리스트 항목 채우기
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = task;
    ulEl.appendChild(li);
  });
}

// 이벤트 등록
document.getElementById("generateBtn").addEventListener("click", generateTasks);
