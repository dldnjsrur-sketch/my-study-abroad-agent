import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import MatchSidebar from './MatchSidebar';

// 初始化 Supabase 客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// LLM 分析函数
const analyzeMatchWithLLM = async (resumeText, program) => {
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  const baseUrl = import.meta.env.VITE_LLM_BASE_URL;

  const prompt = `
你是一位拥有10年经验的资深留学顾问，擅长指导跨专业背景（Non-CS background）的学生申请海外顶级计算机硕士项目。

学生简历文本：
"""
${resumeText}
"""

申请目标项目信息：
- 学校：${program.school}
- 项目：${program.program}
- 专业：${program.major}
- 地区：${program.region}
- 项目特色：${program.isErasmus ? '欧盟联合项目（Erasmus Mundus），注重多元文化和跨国流动性。' : 'QS前500强校项目，学术要求严谨。'}

请根据以上信息，从以下三个维度进行专业打分（0-100%）并给出具体的补课建议。请使用 Markdown 格式返回。

要求：
1. **课程匹配度**：分析学生背景课程与目标项目先修课要求的重合度。
2. **实习/科研经历**：分析过往经历对计算机学习的支撑作用。
3. **文书动机建议**：针对跨专业背景，如何在文书中体现转专业动力和潜力。
4. **具体补课建议**：给出学生在申请前或入学前应修读的具体计算机基础课程建议。

回复模版：
## 🚀 简历分析报告

### 📊 核心维度评分
- **课程匹配度**: [分数]%
- **实习/科研经历**: [分数]%
- **文书动机建议**: [分数]%

### 🔍 详细分析
[详细分析内容...]

### 📚 补课与提升建议
[具体课程建议...]
`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // 或者用户指定的模型
        messages: [
          { role: "system", content: "你是一位资深留学顾问。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("LLM 分析出错:", error);
    return `### ❌ 分析出错\n很抱歉，在连接大模型时遇到了问题：${error.message}\n\n请检查您的 \`.env\` 文件配置是否正确（API_KEY 和 BASE_URL）。`;
  }
};

function App() {
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // 数据加载状态

  // 筛选和排序状态
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterMajor, setFilterMajor] = useState('All');
  const [sortBy, setSortBy] = useState('dateDesc');

  // 获取唯一的地区和专业列表
  const [regions, setRegions] = useState(['All']);
  const [majors, setMajors] = useState(['All']);

  // 从 Supabase 获取数据
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*');
        
        if (error) throw error;

        if (data) {
          setPrograms(data);
          setFilteredPrograms(data);
          
          // 更新筛选选项
          const uniqueRegions = ['All', ...new Set(data.map(p => p.region).filter(Boolean))];
          const uniqueMajors = ['All', ...new Set(data.map(p => p.major).filter(Boolean))];
          setRegions(uniqueRegions);
          setMajors(uniqueMajors);
        }
      } catch (error) {
        console.error('获取项目数据失败:', error);
        alert('无法连接到数据库，请检查 Supabase 配置。');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchPrograms();
  }, []);

  // 综合处理筛选、搜索和排序
  useEffect(() => {
    let result = [...programs];

    if (searchTerm) {
      result = result.filter(program => 
        (program.school?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (program.program?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterRegion !== 'All') {
      result = result.filter(program => program.region === filterRegion);
    }

    if (filterMajor !== 'All') {
      result = result.filter(program => program.major === filterMajor);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.published_date || 0);
      const dateB = new Date(b.published_date || 0);
      if (sortBy === 'dateDesc') return dateB - dateA;
      if (sortBy === 'dateAsc') return dateA - dateB;
      return 0;
    });

    setFilteredPrograms(result);
  }, [searchTerm, filterRegion, filterMajor, sortBy, programs]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // 处理简历上传
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target.result);
        setResumeUploaded(true);
        alert('简历内容已读取，现在可以点击项目进行分析了！');
      };
      reader.readAsText(file);
    }
  };

  // 处理项目卡片点击（分析匹配度）
  const handleProgramClick = async (program) => {
    if (!resumeUploaded) {
      alert('请先上传简历，再进行匹配度分析！');
      return;
    }

    setSelectedProgram(program);
    setSidebarOpen(true);
    setIsAnalyzing(true);
    setMatchResult(null); // 清除旧结果

    // 调用 LLM 分析
    const result = await analyzeMatchWithLLM(resumeText, program);
    setMatchResult(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-neutral">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">留学辅导工具</h1>
            <div className="mt-4 md:mt-0">
              <label className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                <span className="mr-2">{resumeUploaded ? '简历已上传' : '上传简历'}</span>
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  className="hidden" 
                  onChange={handleResumeUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 项目发现页 */}
        <section className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">项目发现</h2>
            <span className="text-sm text-gray-500">共找到 {filteredPrograms.length} 个项目</span>
          </div>
          
          {/* 筛选和搜索栏 */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">搜索</label>
              <input
                type="text"
                placeholder="搜索学校或项目..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* 地区筛选 */}
            <div className="w-full md:w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">地区</label>
              <select 
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm bg-white"
              >
                {regions.map(r => <option key={r} value={r}>{r === 'All' ? '全部地区' : r}</option>)}
              </select>
            </div>

            {/* 专业筛选 */}
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">专业</label>
              <select 
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm bg-white"
              >
                {majors.map(m => <option key={m} value={m}>{m === 'All' ? '全部专业' : m}</option>)}
              </select>
            </div>

            {/* 排序 */}
            <div className="w-full md:w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">排序</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm bg-white"
              >
                <option value="dateDesc">最新发布</option>
                <option value="dateAsc">最早发布</option>
              </select>
            </div>
          </div>

          {/* 项目卡片列表 */}
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-xl shadow-sm">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-gray-500">正在从云端加载最新项目...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPrograms.map(program => (
                <div 
                  key={program.id} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer border border-transparent hover:border-primary/20 flex flex-col"
                  onClick={() => handleProgramClick(program)}
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      {/* 跨专业友好度标签 */}
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {program.friendly_level || program.friendlyLevel}
                      </div>
                      {/* 地区标签 */}
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {program.region}
                      </div>
                    </div>
                    
                    {/* 学校名和项目名 */}
                    <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{program.school}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{program.program}</p>
                    
                    {/* 项目细节 */}
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">专业</span>
                        <span className="font-medium text-gray-700">{program.major}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">学费</span>
                        <span className="font-medium text-gray-700">{program.tuition || '咨询后可见'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">申请截止</span>
                        <span className="font-medium text-gray-700">{program.deadline || '未公布'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">发布日期</span>
                        <span className="font-medium text-gray-700">{program.published_date || program.publishedDate}</span>
                      </div>
                    </div>

                    {/* 标签展示：官方认证和欧盟项目 */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(program.is_official || program.isOfficial) && (
                        <span className="flex items-center px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          官方认证
                        </span>
                      )}
                      {(program.is_erasmus || program.isErasmus) && (
                        <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-[10px] font-bold border border-yellow-100">
                          🇪🇺 欧盟联合项目
                        </span>
                      )}
                      {!(program.is_erasmus || program.isErasmus) && (
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                          🎓 QS 500 相关
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 底部链接 */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-primary font-medium">查看匹配度分析 →</span>
                    {program.url && (
                      <a 
                        href={program.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        官方网址 ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredPrograms.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">没有找到符合条件的项目，请尝试调整筛选条件。</p>
            </div>
          )}
        </section>
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">© 2026 留学辅导工具</p>
        </div>
      </footer>

      {/* 侧边栏 */}
      <MatchSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        program={selectedProgram}
        matchResult={matchResult}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}

export default App;