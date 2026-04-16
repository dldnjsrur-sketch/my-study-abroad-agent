import os
import json
import requests
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# 加载环境变量
load_dotenv()

# 配置信息
TAVILY_API_KEY = os.getenv('TAVILY_API_KEY')
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
LLM_API_KEY = os.getenv('VITE_LLM_API_KEY')
LLM_BASE_URL = os.getenv('VITE_LLM_BASE_URL') # 注意：由于前端使用了代理，脚本中需要映射回原始地址或确保能通

# 搜索关键词
SEARCH_QUERY = "2026 computer science master program admissions Europe Singapore Australia OR Erasmus Mundus Joint Master Degree"

# 初始化 Supabase 客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def search_tavily(query):
    """调用 Tavily Search API 搜索最新项目"""
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "max_results": 10
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json().get('results', [])
    except Exception as e:
        print(f"Tavily 搜索失败: {e}")
        return []

def llm_check_friendly(item):
    """使用 LLM 判断项目是否对跨专业友好并提取信息"""
    # 如果 LLM_BASE_URL 是前端代理路径 /llm-api，在 Python 中需要替换回真实 IP 地址
    real_llm_url = LLM_BASE_URL.replace('/llm-api', 'http://10.197.2.131:3003/api/v1')
    
    prompt = f"""
    请分析以下留学项目信息，判断其是否对“非计算机专业背景（跨专业）”的学生友好。
    
    项目标题: {item.get('title')}
    项目内容: {item.get('content')}
    
    如果是跨专业友好项目，请按以下 JSON 格式返回提取的信息。如果不是，请仅返回字符串 "NOT_FRIENDLY"。
    
    {{
        "school": "学校名称",
        "program": "项目全名",
        "major": "专业方向",
        "region": "所属地区（欧洲/新加坡/澳洲/日本/香港）",
        "tuition": "学费信息（如未知填null）",
        "deadline": "截止日期（如未知填null）",
        "friendly_level": "非常友好/友好",
        "is_erasmus": true/false
    }}
    """
    
    try:
        response = requests.post(
            f"{real_llm_url}/chat/completions",
            headers={"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"},
            json={{
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0
            }}
        )
        content = response.json()['choices'][0]['message']['content'].strip()
        if "NOT_FRIENDLY" in content:
            return None
        # 尝试提取 JSON 部分
        json_str = re.search(r'{{.*}}', content, re.DOTALL)
        if json_str:
            return json.loads(json_str.group())
        return None
    except Exception as e:
        print(f"LLM 检查失败: {e}")
        return None

def update_to_supabase(data, url):
    """将数据插入 Supabase，实现去重逻辑"""
    try:
        # 构造入库数据
        record = {
            "school": data['school'],
            "program": data['program'],
            "major": data['major'],
            "region": data['region'],
            "tuition": data['tuition'],
            "deadline": data['deadline'],
            "friendly_level": data['friendly_level'],
            "url": url,
            "published_date": datetime.now().strftime("%Y-%m-%d"),
            "is_official": any(d in url.lower() for d in ['.edu', '.ac.uk', '.edu.sg', '.edu.au']),
            "is_erasmus": data.get('is_erasmus', False)
        }
        
        # 使用 upsert 逻辑（依赖 school + program 的唯一约束）
        # 注意：Supabase upsert 需要在表上定义唯一约束
        response = supabase.table("projects").upsert(
            record, 
            on_conflict="school,program"
        ).execute()
        
        print(f"成功入库/更新: {data['school']} - {data['program']}")
    except Exception as e:
        print(f"Supabase 入库失败: {e}")

def main():
    print(f"[{datetime.now()}] 启动自动更新任务...")
    
    # 1. 搜索
    results = search_tavily(SEARCH_QUERY)
    print(f"搜索到 {len(results)} 条候选信息")
    
    # 2. 过滤与入库
    for item in results:
        print(f"正在分析: {item.get('title')[:50]}...")
        analysis = llm_check_friendly(item)
        
        if analysis:
            print("确认跨专业友好，准备入库...")
            update_to_supabase(analysis, item.get('url'))
        else:
            print("非跨专业友好或分析失败，跳过。")

if __name__ == "__main__":
    main()
