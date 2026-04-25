import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a expert tutor talking to your student. Analyze {topic}. Identify gaps based on user history. Give user analysis report. Be concise, provide further topics to focus on. A sample response: ```You performed 3 answers correct out of 4. While you have good knowledge in ..., I suggest you focus on topics like ...```"),
    ("user", "{history}")
])

chain = prompt | llm

def get_quiz_response(user_response, topic):
    if isinstance(user_response, str):
        try:
            user_response = json.loads(user_response)
        except:
            return "Invalid JSON"

    try:
        history_str = "\n".join([
            f"Q:{i.get('question')} A:{i.get('answer')} [{'C' if i.get('isCorrect') else 'I'}]"
            for i in user_response
        ])
    except:
        return "Data Format Error"

    response = chain.invoke({
        "topic": topic,
        "history": history_str
    })

    return response.content