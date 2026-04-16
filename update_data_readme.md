# 项目数据更新脚本

## 功能说明

这个 Python 脚本用于定期更新海外硕士项目数据。它会：

1. 调用 Tavily Search API 搜索全球最新的海外硕士项目信息
2. 搜索范围包括：欧洲、新加坡、澳洲、日本、香港
3. 处理搜索结果并提取项目信息
4. 将结果保存为 JSON 格式并覆盖更新本地数据文件

## 环境要求

- Python 3.6+
- requests 库

## 安装依赖

```bash
pip install requests
```

## 获取 Tavily API 密钥

1. 访问 [Tavily](https://www.tavily.com/) 网站
2. 注册账号并获取 API 密钥
3. 复制 API 密钥备用

## 使用方法

### 方法一：设置环境变量

1. 设置 TAVILY_API_KEY 环境变量：

   - Windows:
     ```
     set TAVILY_API_KEY=your-api-key-here
     ```
   - macOS/Linux:
     ```
     export TAVILY_API_KEY=your-api-key-here
     ```

2. 运行脚本：
   ```bash
   python update_programs.py
   ```

### 方法二：直接在命令行中提供 API 密钥

```bash
python update_programs.py --api-key your-api-key-here
```

## 脚本工作流程

1. 脚本会依次搜索每个区域的计算机科学硕士项目
2. 对每个搜索结果进行处理，提取学校名、项目名、学费、申请截止日期和跨专业友好度
3. 去重后，将结果保存到 `src/data/programs.json` 文件
4. 每个项目会自动分配一个唯一的 ID

## 注意事项

- 由于使用了简化的信息提取逻辑，提取的学费和截止日期可能不是非常准确
- 实际应用中，可能需要更复杂的 NLP 处理来提高信息提取的准确性
- 搜索结果的质量取决于 Tavily API 的返回结果

## 定期更新

可以通过设置定时任务来定期运行此脚本，例如：

- Windows：使用任务计划程序
- macOS/Linux：使用 crontab

这样可以确保项目数据始终保持最新状态。