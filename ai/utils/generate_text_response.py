import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

def generate_text_response(conversation_history,user_message, topic):
    load_dotenv()

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a expert tutor talking to your student. Analyze {topic}. Respond in a clear way a user may understand as per the user message."),
        ("user", "{history}\n\nUser: {message}")
    ])

    chain = prompt | llm

    response = chain.invoke({
        "topic": topic,
        "history": conversation_history,
        "message": user_message
    })

    return response.content