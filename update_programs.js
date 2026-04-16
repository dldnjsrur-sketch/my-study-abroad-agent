#!/usr/bin/env node
import fs from 'fs';
import https from 'https';

// 配置API密钥
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || 'your-api-key-here';

// 搜索区域
const REGIONS = [
    "Europe",
    "Singapore",
    "Australia",
    "Japan",
    "Hong Kong"
];

// 搜索关键词 (优化：聚焦“硕士项目招生简章”和“欧盟联合项目”，排除纯排名列表)
const SEARCH_QUERY = "{region} master degree program admissions computer science 2026 OR Erasmus Mundus Joint Master Degree";

// 本地数据文件路径
const DATA_FILE = "src/data/programs.json";

// 常见官方教育域名后缀
const OFFICIAL_DOMAINS = ['.edu', '.ac.uk', '.edu.sg', '.edu.au', '.edu.hk', '.ac.jp', '.ch', '.de', '.nl', '.se', '.fi', '.no', '.dk', '.at', '.be', '.ie', '.it', '.es', '.pt'];

function isOfficialSource(url) {
    /* 判断 URL 是否为官方教育机构网站 */
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return OFFICIAL_DOMAINS.some(domain => lowerUrl.includes(domain)) || 
           lowerUrl.includes('university') || 
           lowerUrl.includes('college') || 
           lowerUrl.includes('institute') ||
           lowerUrl.includes('erasmus-mundus.eu');
}

function searchTavily(query) {
    /* 调用Tavily Search API搜索信息 */
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            query: query,
            search_depth: "advanced",
            max_results: 5
        });

        const options = {
            hostname: 'api.tavily.com',
            path: '/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TAVILY_API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.error) {
                        console.error("API 错误:", parsedData.error);
                    }
                    resolve(parsedData);
                } catch (error) {
                    console.error("解析响应失败. 原始数据:", data.substring(0, 200));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

function processSearchResults(results, region) {
    /* 处理搜索结果，提取项目信息 */
    const processedPrograms = [];
    
    console.log(`处理 ${region} 的搜索结果...`);
    console.log(`结果数量: ${results?.results?.length || 0}`);
    
    if (!results || !results.results) {
        console.log(`没有找到 ${region} 的结果`);
        return processedPrograms;
    }
    
    for (let i = 0; i < results.results.length; i++) {
        const item = results.results[i];
        const title = item.title || "";
        const content = item.content || "";
        const url = item.url || "";
        const publishedDate = item.published_date || new Date().toISOString().split('T')[0];
        
        const lowerTitle = title.toLowerCase();
        const lowerContent = content.toLowerCase();

        // 1. 严格过滤：排除纯排名、对比列表等无关信息
        const isPureRanking = (lowerTitle.includes("ranking") || lowerTitle.includes("top 10") || lowerTitle.includes("best universities")) && 
                             !lowerTitle.includes("program") && !lowerTitle.includes("master");
        
        if (isPureRanking) {
            console.log(`跳过排名信息: ${title}`);
            continue;
        }

        // 2. 核心条件：必须是硕士项目招生相关，且属于目标区域或欧盟项目
        const isMasterProgram = lowerTitle.includes("master") || lowerTitle.includes("msc") || lowerTitle.includes("postgraduate") || lowerContent.includes("degree");
        const isErasmus = lowerContent.includes("erasmus") || lowerContent.includes("mundus") || lowerTitle.includes("erasmus");
        const isTopRankingContext = lowerContent.includes("qs") || lowerContent.includes("top 500") || lowerContent.includes("ranking") || lowerTitle.includes("university");

        if (!isMasterProgram || (!isErasmus && !isTopRankingContext)) {
            console.log(`跳过非项目信息: ${title}`);
            continue;
        }

        console.log(`\n处理符合要求的项目: ${title}`);
        
        // 3. 官方认证识别
        const isOfficial = isOfficialSource(url);
        
        // 提取学校名和项目名
        let school = "";
        let program = "";
        
        if (title.includes(" - ")) {
            const parts = title.split(" - ");
            if (parts.length >= 2) {
                school = parts[0].trim();
                program = parts[1].trim();
            }
        } else if (title.includes(": ")) {
            const parts = title.split(": ");
            if (parts.length >= 2) {
                school = parts[0].trim();
                program = parts[1].trim();
            }
        } else {
            program = title.trim();
            school = isErasmus ? "EU Joint Program" : "目标大学";
        }
        
        // 提取学费信息
        let tuition = "咨询官网";
        const tuitionMatch = lowerContent.match(/(?:fee|tuition|cost|price)[:\s]*([^\.\n,]+)/);
        if (tuitionMatch) {
            tuition = tuitionMatch[1].trim();
        } else if (lowerContent.includes("tuition") || lowerContent.includes("fee")) {
            tuition = "有相关信息，请点击网址查看";
        }
        
        // 提取申请截止日期
        let deadline = "未公布";
        const deadlineMatch = lowerContent.match(/(?:deadline|apply by)[:\s]*([^\.\n,]+)/);
        if (deadlineMatch) {
            deadline = deadlineMatch[1].trim();
        } else if (lowerContent.includes("deadline") || lowerContent.includes("application")) {
            deadline = "12月-2月（参考）";
        }
        
        // 跨专业友好度
        let friendlyLevel = "友好";
        if (lowerContent.includes("non-major") || lowerContent.includes("no background") || lowerContent.includes("any discipline") || lowerContent.includes("跨专业")) {
            friendlyLevel = "非常友好";
        }

        // 提取专业
        let major = "Computer Science";
        if (lowerContent.includes("data science")) major = "Data Science";
        if (lowerContent.includes("artificial intelligence") || lowerContent.includes("ai")) major = "Artificial Intelligence";
        if (lowerContent.includes("software engineering")) major = "Software Engineering";
        if (lowerContent.includes("cyber security")) major = "Cyber Security";
        
        if (program) {
            processedPrograms.push({
                school: school,
                program: program,
                tuition: tuition,
                deadline: deadline,
                friendlyLevel: friendlyLevel,
                url: url,
                publishedDate: publishedDate,
                region: region,
                major: major,
                isOfficial: isOfficial,
                isErasmus: isErasmus
            });
            console.log(`已添加项目: ${program} (来源: ${isOfficial ? '官方' : '综合'})`);
        }
    }
    
    return processedPrograms;
}

function updateDataFile(programs) {
    /* 更新本地数据文件 */
    // 为每个项目添加ID
    for (let i = 0; i < programs.length; i++) {
        programs[i].id = i + 1;
    }
    
    // 写入文件
    fs.writeFileSync(DATA_FILE, JSON.stringify(programs, null, 2), 'utf-8');
    
    console.log(`数据文件已更新，共 ${programs.length} 个项目`);
}

async function main() {
    /* 主函数 */
    // 解析命令行参数
    const args = process.argv.slice(2);
    let apiKey = TAVILY_API_KEY;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--api-key' && i + 1 < args.length) {
            apiKey = args[i + 1];
        }
    }
    
    // 验证API密钥
    if (apiKey === 'your-api-key-here') {
        console.error("错误: 请设置TAVILY_API_KEY环境变量或使用--api-key参数");
        process.exit(1);
    }
    
    const allPrograms = [];
    
    // 搜索每个区域
    for (const region of REGIONS) {
        console.log(`正在搜索 ${region} 的项目...`);
        const query = SEARCH_QUERY.replace('{region}', region);
        
        try {
            const results = await searchTavily(query);
            const programs = processSearchResults(results, region);
            allPrograms.push(...programs);
            console.log(`找到 ${programs.length} 个项目`);
        } catch (error) {
            console.error(`搜索 ${region} 时出错: ${error.message}`);
        }
    }
    
    // 去重
    const uniquePrograms = [];
    const seen = new Set();
    
    for (const program of allPrograms) {
        const key = `${program.school}-${program.program}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePrograms.push(program);
        }
    }
    
    // 更新数据文件
    if (uniquePrograms.length > 0) {
        updateDataFile(uniquePrograms);
    } else {
        console.log("没有找到项目信息");
    }
}

// 运行主函数
main().catch(error => {
    console.error(`执行出错: ${error.message}`);
    process.exit(1);
});