import React from 'react';
import { UploadProgress as UploadProgressType } from '../types/github';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface UploadProgressProps {
  progress: UploadProgressType[];
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  const getStatusIcon = (status: UploadProgressType['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-[#f85149]" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />;
      default:
        return <Clock className="w-4 h-4 text-[#8b949e]" />;
    }
  };

  const getStatusText = (status: UploadProgressType['status']) => {
    switch (status) {
      case 'success':
        return '완료';
      case 'error':
        return '실패';
      case 'uploading':
        return '업로드 중...';
      default:
        return '대기 중';
    }
  };

  const total = progress.length;
  const success = progress.filter(p => p.status === 'success').length;
  const error = progress.filter(p => p.status === 'error').length;
  const uploading = progress.filter(p => p.status === 'uploading').length;
  const overallProgress = total > 0 ? ((success + error) / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#c9d1d9]">
            전체 진행률
          </span>
          <span className="text-sm text-[#8b949e]">
            {success}/{total} 완료
          </span>
        </div>
        <div className="w-full bg-[#21262d] rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[#238636] transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
          <span>성공: {success}</span>
          <span>실패: {error}</span>
          <span>업로드 중: {uploading}</span>
        </div>
      </div>

      {/* File List */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#0d1117] max-h-64 overflow-y-auto">
        {progress.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 border-b border-[#30363d] last:border-b-0"
          >
            {getStatusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#c9d1d9] truncate">{item.fileName}</div>
              {item.status === 'uploading' && (
                <div className="w-full bg-[#21262d] rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#58a6ff] transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === 'error' && item.error && (
                <div className="text-xs text-[#f85149] mt-1">{item.error}</div>
              )}
            </div>
            <span className="text-xs text-[#8b949e]">{getStatusText(item.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadProgress;

