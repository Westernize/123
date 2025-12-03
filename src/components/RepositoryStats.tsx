import React, { useState, useEffect } from 'react';
import { Repository, RepositoryStats as RepositoryStatsType } from '../types/github';
import { getRepositoryStats } from '../utils/github';
import { FileText, Code, Clock, Loader2 } from 'lucide-react';

interface RepositoryStatsProps {
  octokit: any;
  repo: Repository;
}

const RepositoryStats: React.FC<RepositoryStatsProps> = ({ octokit, repo }) => {
  const [stats, setStats] = useState<RepositoryStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [octokit, repo]);

  const loadStats = async () => {
    if (!octokit) return;

    try {
      setLoading(true);
      const repoStats = await getRepositoryStats(octokit, repo);
      setStats(repoStats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-[#8b949e]">
        <p>통계를 불러올 수 없습니다</p>
      </div>
    );
  }

  // 언어별 파일 수와 퍼센트 계산
  const totalFileCount = Object.values(stats.languages).reduce((sum, count) => sum + count, 0);
  const languageEntries = Object.entries(stats.languages)
    .map(([lang, count]) => ({
      lang,
      count,
      percentage: totalFileCount > 0 ? (count / totalFileCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#58a6ff]" />
            <span className="text-xs text-[#8b949e]">총 파일</span>
          </div>
          <div className="text-2xl font-bold text-[#c9d1d9]">{stats.totalFiles}</div>
        </div>
        <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-[#58a6ff]" />
            <span className="text-xs text-[#8b949e]">총 크기</span>
          </div>
          <div className="text-2xl font-bold text-[#c9d1d9]">{formatSize(stats.totalSize)}</div>
        </div>
      </div>

      {/* Language List */}
      {Object.keys(stats.languages).length > 0 && (
        <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-[#58a6ff]" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">언어별 파일 수</h3>
          </div>
          <div className="space-y-2">
            {languageEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#30363d]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#c9d1d9]">{entry.lang}</span>
                  <span className="text-xs text-[#8b949e]">{entry.count}개</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-[#21262d] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#1f6feb] transition-all"
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#58a6ff] w-12 text-right">
                    {entry.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-xs text-[#8b949e]">
        <Clock className="w-4 h-4" />
        <span>
          마지막 업데이트: {new Date(stats.lastUpdated).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  );
};

export default RepositoryStats;

