import React from 'react';

const MatchSidebar = ({ isOpen, onClose, program, matchResult }) => {
  if (!isOpen || !program || !matchResult) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>
      
      {/* 侧边栏 */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="p-6 h-full flex flex-col">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">项目匹配分析</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 项目信息 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{program.school}</h3>
            <p className="text-gray-600">{program.program}</p>
          </div>
          
          {/* 匹配分数 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">匹配分数</span>
              <span className="text-2xl font-bold text-primary">{matchResult.score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${matchResult.score}%` }}
              ></div>
            </div>
          </div>
          
          {/* 优势 */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-3">优势</h4>
            <ul className="space-y-2">
              {matchResult.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 劣势 */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-3">劣势</h4>
            <ul className="space-y-2">
              {matchResult.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 底部按钮 */}
          <div className="mt-auto">
            <button 
              className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSidebar;