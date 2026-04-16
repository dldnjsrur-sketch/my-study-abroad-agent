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

# 搜索关键词
SEARCH_QUERY = "computer science master program for non-majors {region} 2026"

# 本地数据文件路径
DATA_FILE = "src/data/programs.json"

def search_tavily(query):
    """调用Tavily Search API搜索信息"""
    url = "https://api.tavily.com/search"
    params = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "max_results": 5
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"搜索失败: {e}")
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
        
        # 提取学校名和项目名
        school = ""
        program = ""
        
        # 简单的提取逻辑，实际应用中可能需要更复杂的NLP处理
        if " - " in title:
            parts = title.split(" - ")
            if len(parts) >= 2:
                school = parts[0].strip()
                program = parts[1].strip()
        
        # 提取学费信息（简化版）
        tuition = ""
        if "tuition" in content.lower() or "fee" in content.lower():
            tuition = "$40,000-$60,000/年"  # 占位符，实际应用中需要提取真实值
        
        # 提取申请截止日期（简化版）
        deadline = ""
        if "deadline" in content.lower() or "application" in content.lower():
            deadline = "12月-1月"  # 占位符，实际应用中需要提取真实值
        
        # 跨专业友好度（简化版）
        friendly_level = "友好"
        if "non-major" in content.lower() or "no background" in content.lower():
            friendly_level = "非常友好"
        
        if school and program:
            processed_programs.append({
                "school": school,
                "program": program,
                "tuition": tuition,
                "deadline": deadline,
                "friendlyLevel": friendly_level
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