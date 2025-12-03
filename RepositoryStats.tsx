import React, { useState, useEffect } from 'react';
import { Repository, RepositoryStats as RepositoryStatsType } from '../types/github';
import { getRepositoryStats } from '../utils/github';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FileText, Code, Clock, Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const languageData = {
    labels: Object.keys(stats.languages).slice(0, 10),
    datasets: [
      {
        label: '파일 수',
        data: Object.keys(stats.languages)
          .slice(0, 10)
          .map((lang) => stats.languages[lang]),
        backgroundColor: '#1f6feb',
      },
    ],
  };

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

      {/* Language Chart */}
      {Object.keys(stats.languages).length > 0 && (
        <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-[#58a6ff]" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">언어별 파일 수</h3>
          </div>
          <Bar
            data={languageData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: '#161b22',
                  titleColor: '#c9d1d9',
                  bodyColor: '#c9d1d9',
                  borderColor: '#30363d',
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  ticks: {
                    color: '#8b949e',
                  },
                  grid: {
                    color: '#30363d',
                  },
                },
                y: {
                  ticks: {
                    color: '#8b949e',
                  },
                  grid: {
                    color: '#30363d',
                  },
                },
              },
            }}
            height={200}
          />
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

