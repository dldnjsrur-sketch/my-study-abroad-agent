import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

const MatchSidebar = ({ isOpen, onClose, program, matchResult, isAnalyzing }) => {
  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>
      
      {/* 侧边栏 */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">AI 简历分析报告</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 项目简要信息 */}
          <div className="mb-6 bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h3 className="text-lg font-bold text-gray-800 mb-1">{program.school}</h3>
            <p className="text-gray-600 text-sm">{program.program}</p>
          </div>
          
          {/* 分析内容 */}
          <div className="prose prose-sm max-w-none">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-gray-500 font-medium">资深顾问正在深度分析您的简历...</p>
                <p className="text-xs text-gray-400">预计需要 10-20 秒，请稍候</p>
              </div>
            ) : matchResult ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ReactMarkdown 
                  components={{
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4 border-b pb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-700 mt-5 mb-3" {...props} />,
                    p: ({node, ...props}) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 text-gray-600" {...props} />,
                    li: ({node, ...props}) => <li className="ml-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                  }}
                >
                  {matchResult}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                等待分析结果...
              </div>
            )}
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button 
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md active:scale-[0.98]"
            onClick={onClose}
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchSidebar;
