#!/usr/bin/env python3
import os
import json
import requests
import argparse

# 配置API密钥
TAVILY_API_KEY = os.getenv('TAVILY_API_KEY', 'your-api-key-here')

# 搜索区域
REGIONS = [
    "Europe",
    "Singapore",
    "Australia",
    "Japan",
    "Hong Kong"
]

# 搜索关键词 (优化：聚焦“硕士项目招生简章”和“欧盟联合项目”，排除纯排名列表)
SEARCH_QUERY = "{region} master degree program admissions computer science 2026 OR Erasmus Mundus Joint Master Degree"

# 本地数据文件路径
DATA_FILE = "src/data/programs.json"

# 常见官方教育域名后缀
OFFICIAL_DOMAINS = ['.edu', '.ac.uk', '.edu.sg', '.edu.au', '.edu.hk', '.ac.jp', '.ch', '.de', '.nl', '.se', '.fi', '.no', '.dk', '.at', '.be', '.ie', '.it', '.es', '.pt']

def is_official_source(url):
    """判断 URL 是否为官方教育机构网站"""
    if not url: return False
    lower_url = url.lower()
    return any(domain in lower_url for domain in OFFICIAL_DOMAINS) or \
           'university' in lower_url or \
           'college' in lower_url or \
           'institute' in lower_url or \
           'erasmus-mundus.eu' in lower_url

def search_tavily(query):
    """调用Tavily Search API搜索信息"""
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "max_results": 5
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"搜索失败: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"响应内容: {e.response.text}")
        return None

def process_search_results(results, region):
    """处理搜索结果，提取项目信息"""
    processed_programs = []
    
    if not results or "results" not in results:
        return processed_programs
    
    for item in results["results"]:
        title = item.get("title", "")
        url = item.get("url", "")
        content = item.get("content", "")
        published_date = item.get("published_date", "2026-04-15")
        
        lower_title = title.lower()
        lower_content = content.lower()

        # 1. 严格过滤：排除纯排名、对比列表等无关信息
        is_pure_ranking = ("ranking" in lower_title or "top 10" in lower_title or "best universities" in lower_title) and \
                         "program" not in lower_title and "master" not in lower_title
        
        if is_pure_ranking:
            print(f"跳过排名信息: {title}")
            continue

        # 2. 核心条件：必须是硕士项目招生相关，且属于目标区域或欧盟项目
        is_master_program = "master" in lower_title or "msc" in lower_title or "postgraduate" in lower_title or "degree" in lower_content
        is_erasmus = "erasmus" in lower_content or "mundus" in lower_content or "erasmus" in lower_title
        is_top_ranking_context = "qs" in lower_content or "top 500" in lower_content or "ranking" in lower_content or "university" in lower_title

        if not is_master_program or (not is_erasmus and not is_top_ranking_context):
            print(f"跳过非项目信息: {title}")
            continue

        print(f"处理符合要求的项目: {title}")
        
        # 3. 官方认证识别
        is_official = is_official_source(url)
        
        # 提取学校名和项目名
        school = ""
        program = ""
        
        if " - " in title:
            parts = title.split(" - ")
            if len(parts) >= 2:
                school = parts[0].strip()
                program = parts[1].strip()
        elif ": " in title:
            parts = title.split(": ")
            if len(parts) >= 2:
                school = parts[0].strip()
                program = parts[1].strip()
        else:
            program = title.strip()
            school = "EU Joint Program" if is_erasmus else "目标大学"
        
        # 提取学费信息
        tuition = "咨询官网"
        import re
        tuition_match = re.search(r"(?:fee|tuition|cost|price)[:\s]*([^\.\n,]+)", lower_content)
        if tuition_match:
            tuition = tuition_match.group(1).strip()
        elif "tuition" in lower_content or "fee" in lower_content:
            tuition = "有相关信息，请点击网址查看"
        
        # 提取申请截止日期
        deadline = "未公布"
        deadline_match = re.search(r"(?:deadline|apply by)[:\s]*([^\.\n,]+)", lower_content)
        if deadline_match:
            deadline = deadline_match.group(1).strip()
        elif "deadline" in lower_content or "application" in lower_content:
            deadline = "12月-2月（参考）"
        
        # 跨专业友好度
        friendly_level = "友好"
        if "non-major" in lower_content or "no background" in lower_content or "any discipline" in lower_content or "跨专业" in lower_content:
            friendly_level = "非常友好"

        # 提取专业
        major = "Computer Science"
        if "data science" in lower_content: major = "Data Science"
        if "artificial intelligence" in lower_content or "ai" in lower_content: major = "Artificial Intelligence"
        if "software engineering" in lower_content: major = "Software Engineering"
        if "cyber security" in lower_content: major = "Cyber Security"
        
        if program:
            processed_programs.append({
                "school": school,
                "program": program,
                "tuition": tuition,
                "deadline": deadline,
                "friendlyLevel": friendly_level,
                "url": url,
                "publishedDate": published_date,
                "region": region,
                "major": major,
                "isOfficial": is_official,
                "isErasmus": is_erasmus
            })
    
    return processed_programs

def update_data_file(programs):
    """更新本地数据文件"""
    # 为每个项目添加ID
    for i, program in enumerate(programs, 1):
        program["id"] = i
    
    # 写入文件
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(programs, f, ensure_ascii=False, indent=2)
    
    print(f"数据文件已更新，共 {len(programs)} 个项目")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="更新海外硕士项目数据")
    parser.add_argument('--api-key', help='Tavily API密钥')
    args = parser.parse_args()
    
    # 如果提供了API密钥，则使用它
    global TAVILY_API_KEY
    if args.api_key:
        TAVILY_API_KEY = args.api_key
    
    # 验证API密钥
    if TAVILY_API_KEY == 'your-api-key-here':
        print("错误: 请设置TAVILY_API_KEY环境变量或使用--api-key参数")
        return
    
    all_programs = []
    
    # 搜索每个区域
    for region in REGIONS:
        print(f"正在搜索 {region} 的项目...")
        query = SEARCH_QUERY.format(region=region)
        results = search_tavily(query)
        
        if results:
            programs = process_search_results(results, region)
            all_programs.extend(programs)
            print(f"找到 {len(programs)} 个项目")
    
    # 去重
    unique_programs = []
    seen = set()
    for program in all_programs:
        key = (program["school"], program["program"])
        if key not in seen:
            seen.add(key)
            unique_programs.append(program)
    
    # 更新数据文件
    if unique_programs:
        update_data_file(unique_programs)
    else:
        print("没有找到项目信息")

if __name__ == "__main__":
    main()