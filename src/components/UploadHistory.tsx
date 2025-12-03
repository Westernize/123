import React from 'react';
import { UploadHistory as UploadHistoryType } from '../types/github';
import { Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

interface UploadHistoryProps {
  history: UploadHistoryType[];
  onClear: () => void;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ history, onClear }) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-[#8b949e]">
        <Clock className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
        <p>업로드 히스토리가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#c9d1d9]">
          최근 업로드 ({history.length})
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-[#8b949e] hover:text-[#f85149] transition-colors"
        >
          전체 삭제
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#1f6feb] transition-colors"
          >
            <div className="flex items-start gap-3">
              {item.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#3fb950] flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-[#f85149] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#c9d1d9] truncate">
                    {item.repoName}
                  </span>
                  <a
                    href={`https://github.com/${item.repoFullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-[#8b949e] mb-2 line-clamp-2">
                  {item.commitMessage}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#6e7681]">
                  <span>{item.files.length}개 파일</span>
                  <span>{formatDate(item.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadHistory;

