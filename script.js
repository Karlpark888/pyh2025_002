// script.js

// 만다라트의 목표 입력값을 가져오는 함수
function getMandalGoals() {
    const vision = document.getElementById("vision").value.trim(); // 1번 비전
    const goals = [];
    for (let i = 2; i <= 9; i++) {
      const goalValue = document.getElementById(`goal${i}`).value.trim();
      if (goalValue) {
        goals.push(goalValue);
      } else {
        goals.push(`목표${i} (미입력)`);
      }
    }
    return { vision, goals };
  }
  
  // OpenAI API를 사용해 각 목표당 8개의 할 일을 생성
  async function generateTasks() {
    const apiKey = document.getElementById("apiKey").value.trim();
    if (!apiKey) {
      alert("API Key를 입력해주세요!");
      return;
    }
  
    const { vision, goals } = getMandalGoals();
    const taskResultsEl = document.getElementById("taskResults");
    taskResultsEl.innerHTML = ""; // 기존 결과 초기화
  
    // 로딩 표시
    taskResultsEl.innerHTML = "<p>GPT가 할 일을 생성하고 있습니다. 잠시만 기다려주세요...</p>";
  
    // 목표가 여러 개이므로, 각 목표마다 GPT에 요청
    const allTaskBlocks = [];
  
    for (let i = 0; i < goals.length; i++) {
      const goalText = goals[i];
      // GPT에게 보낼 프롬프트 구성
      const prompt = `
  다음은 내가 이루고자 하는 비전입니다: "${vision}"
  이를 달성하기 위한 구체적인 목표 중 하나는 "${goalText}"입니다.
  
  아래의 형식에 맞춰 "${goalText}"를 달성하기 위해 도움이 될 만한 할 일 8가지를 만들어주세요.
  
  예시:
  1) 할 일
  2) 할 일
  ...
  
  해당 목표를 달성하는 데 실질적으로 도움이 되도록 작성해주세요.
      `;
  
      try {
        // Fetch를 이용해 OpenAI API 호출
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
          throw new Error(`OpenAI API Error: ${response.status} - ${response.statusText}`);
        }
  
        const data = await response.json();
        const assistantMessage = data.choices[0].message.content.trim();
  
        // 결과 파싱(간단히 텍스트 분할하거나 그대로 사용)
        const tasks = assistantMessage.split("\n").filter((line) => line.trim() !== "");
  
        // HTML 블록 생성
        const blockHtml = createTaskBlock(goalText, tasks);
        allTaskBlocks.push(blockHtml);
      } catch (error) {
        console.error(error);
        allTaskBlocks.push(`<div class="task-block"><p>목표 "${goalText}"의 할 일 생성 실패: ${error.message}</p></div>`);
      }
    }
  
    // 최종 결과 출력
    taskResultsEl.innerHTML = allTaskBlocks.join("");
  }
  
  // 목표 및 할 일 목록을 HTML로 만드는 함수
  function createTaskBlock(goalText, tasks) {
    let listItems = "";
    tasks.forEach((task) => {
      listItems += `<li>${task}</li>`;
    });
  
    return `
      <div class="task-block">
        <h2>목표: ${goalText}</h2>
        <ul>
          ${listItems}
        </ul>
      </div>
    `;
  }
  
  // "목표별 할 일 생성하기" 버튼 이벤트 등록
  document.getElementById("generateBtn").addEventListener("click", generateTasks);
  