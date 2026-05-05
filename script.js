const QWEN_KEY = "sk-f036c3eb0afb403c8037ca6514b557b1";
const GEMINI_KEY = "sk-QFGoJxpXTHaoRmDa3052Ec2d0cA6445894FdB20aDf00AeF1";

const QWEN_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

const GEMINI_URL =
  "https://api.apiyi.com/v1/chat/completions";

const btn = document.getElementById("analyzeBtn");
const input = document.getElementById("inputText");
const loading = document.getElementById("loading");
const qwenResult = document.getElementById("qwenResult");
const geminiResult = document.getElementById("geminiResult");

async function callQwen(text){
  const prompt = `
あなたは言語分析のアシスタントです。
次のテキストに比喩表現（メタファー）が含まれているかを判定してください。

要件：
1. 比喩があるか（true/false）
2. 比喩の可能性がある語
3. 概念領域に関係しそうな名詞
※説明禁止
※JSONのみ

出力形式：
{
 "has_metaphor": true/false,
 "trigger_words": [],
 "domain_candidates": []
}

テキスト:
"""${text}"""
`;

  const res = await fetch(QWEN_URL,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":`Bearer ${QWEN_KEY}`
    },
    body:JSON.stringify({
      model:"qwen3.5-plus",
      messages:[
        {
          role:"user",
          content:prompt
        }
      ],
      temperature:0.1,
      response_format:{
        type:"json_object"
      }
    })
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(text,qwenData){
  const systemPrompt = `
あなたは認知言語学の専門家です。
前段モデルの判定を検証し、
最終的な比喩分析を行ってください。

要件:
1. 比喩か
2. 比喩表現
3. source domain
4. target domain
5. conceptual mapping

JSONのみ出力
`;

  const userPrompt = `
Text:
${text}

Qwen Hint:
${qwenData}
`;

  const res = await fetch(GEMINI_URL,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":`Bearer ${GEMINI_KEY}`
    },
    body:JSON.stringify({
      model:"gemini-3-pro-preview",
      messages:[
        {
          role:"system",
          content:systemPrompt
        },
        {
          role:"user",
          content:userPrompt
        }
      ]
    })
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

btn.onclick = async ()=>{
  const text = input.value.trim();

  if(!text){
    alert("请输入文本");
    return;
  }

  loading.classList.remove("hidden");
  qwenResult.textContent = "分析中...";
  geminiResult.textContent = "loading...";

  try{
    const qwen = await callQwen(text);
    qwenResult.textContent = qwen;

    const gemini = await callGemini(text,qwen);
    geminiResult.textContent = gemini;
  }catch(e){
    geminiResult.textContent = "Error: "+e.message;
  }

  loading.classList.add("hidden");
};
