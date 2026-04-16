import { useState, useEffect } from 'react';
import programsData from './data/programs.json';
import MatchSidebar from './MatchSidebar';

// 模拟AI匹配逻辑
const simulateAIMatch = (program) => {
  // 生成随机匹配分数（70-95%）
  const score = Math.floor(Math.random() * 26) + 70;
  
  // 模拟优势和劣势
  const strengths = [
    "跨专业背景多元化",
    "学习能力强",
    "对计算机科学有浓厚兴趣",
    "良好的逻辑思维能力",
    "相关实习经验"
  ];
  
  const weaknesses = [
    "缺乏编程经验",
    "需要补修基础课程",
    "相关专业背景不足",
    "技术技能需要提升",
    "项目经验有限"
  ];
  
  // 随机选择2-3个优势和劣势
  const randomStrengths = strengths
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 2) + 2);
  
  const randomWeaknesses = weaknesses
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 2) + 2);
  
  return {
    score,
    strengths: randomStrengths,
    weaknesses: randomWeaknesses
  };
};

function App() {
  const [programs, setPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setPrograms(programsData);
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === '') {
      setPrograms(programsData);
    } else {
      const filtered = programsData.filter(program => 
        program.school.toLowerCase().includes(term) ||
        program.program.toLowerCase().includes(term)
      );
      setPrograms(filtered);
    }
  };

  // 处理简历上传
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 这里可以添加实际的文件处理逻辑
      // 目前只是模拟上传成功
      setResumeUploaded(true);
      alert('简历上传成功！');
    }
  };

  // 处理项目卡片点击
  const handleProgramClick = (program) => {
    setSelectedProgram(program);
    // 模拟AI匹配
    const result = simulateAIMatch(program);
    setMatchResult(result);
    setSidebarOpen(true);
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
        <section className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">项目发现</h2>
          
          {/* 搜索框 */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="搜索学校或项目..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* 项目卡片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map(program => (
              <div 
                key={program.id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleProgramClick(program)}
              >
                <div className="p-6">
                  {/* 跨专业友好度标签 */}
                  <div className="inline-block mb-3 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {program.friendlyLevel}
                  </div>
                  
                  {/* 学校名和项目名 */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{program.school}</h3>
                  <p className="text-gray-600 mb-4">{program.program}</p>
                  
                  {/* 学费和截止日期 */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">学费:</span>
                      <span className="font-medium">{program.tuition}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">申请截止日期:</span>
                      <span className="font-medium">{program.deadline}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
      />
    </div>
  );
}

export default App;