import React, { useState } from 'react';
import { Repository } from '../types/github';
import { FolderPlus, X, Lock, Globe, Trash2 } from 'lucide-react';

interface RepositorySelectorProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  onSelect: (repo: Repository) => void;
  onCreate: (name: string, description: string, isPrivate: boolean) => void;
  onDelete: (repo: Repository) => void;
  showCreate: boolean;
  onCloseCreate: () => void;
  currentUser?: string | null;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({
  repositories,
  selectedRepo,
  onSelect,
  onCreate,
  onDelete,
  showCreate,
  onCloseCreate,
  currentUser,
}) => {
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setCreating(true);
    try {
      await onCreate(repoName.trim(), repoDescription.trim(), isPrivate);
      setRepoName('');
      setRepoDescription('');
      setIsPrivate(false);
    } finally {
      setCreating(false);
    }
  };

  if (showCreate) {
    return (
      <div className="border border-[#30363d] rounded-xl p-5 bg-[#0d1117]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[#c9d1d9] text-base">새 레포지토리 만들기</h3>
          <button
            onClick={onCloseCreate}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-2">
              이름 <span className="text-[#f85149]">*</span>
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-portfolio"
              className="w-full px-3.5 py-2.5 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] transition-all text-[#c9d1d9] placeholder:text-[#6e7681] bg-[#161b22]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-2">
              설명
            </label>
            <input
              type="text"
              value={repoDescription}
              onChange={(e) => setRepoDescription(e.target.value)}
              placeholder="포트폴리오 프로젝트"
              className="w-full px-3.5 py-2.5 border border-[#30363d] rounded-lg focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] transition-all text-[#c9d1d9] placeholder:text-[#6e7681] bg-[#161b22]"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-[#1f6feb] border-[#30363d] rounded focus:ring-[#1f6feb] bg-[#161b22]"
            />
            <label htmlFor="private" className="text-sm text-[#c9d1d9] font-medium">
              비공개 레포지토리
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={creating || !repoName.trim()}
              className="flex-1 bg-[#238636] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {creating ? '생성 중...' : '생성'}
            </button>
            <button
              type="button"
              onClick={onCloseCreate}
              className="px-4 py-2.5 border border-[#30363d] rounded-lg text-[#c9d1d9] hover:bg-[#21262d] transition-colors font-medium bg-[#161b22]"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent, repo: Repository) => {
    e.stopPropagation(); // 부모 버튼의 onClick 이벤트 방지
    onDelete(repo);
  };

  // 현재 사용자가 소유한 레포지토리인지 확인
  const isOwner = (repo: Repository) => {
    if (!currentUser || !repo.owner) {
      // owner 정보가 없으면 full_name에서 추출
      const [owner] = repo.full_name.split('/');
      return owner === currentUser;
    }
    return repo.owner.login === currentUser;
  };

  return (
    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
      {repositories.length === 0 ? (
        <div className="text-center py-12 text-[#8b949e] text-sm">
          <FolderPlus className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
          <p>레포지토리가 없습니다</p>
        </div>
      ) : (
        repositories.map((repo) => (
          <div
            key={repo.id}
            className={`group relative rounded-xl border transition-all ${
              selectedRepo?.id === repo.id
                ? 'border-[#1f6feb] bg-[#1c2128] shadow-md'
                : 'border-[#30363d] hover:border-[#1f6feb] hover:bg-[#21262d] hover:shadow-md bg-[#161b22]'
            }`}
          >
            <button
              onClick={() => onSelect(repo)}
              className="w-full text-left p-3.5 pr-12"
            >
              <div className="flex items-start gap-2.5">
                <FolderPlus className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  selectedRepo?.id === repo.id ? 'text-[#58a6ff]' : 'text-[#8b949e]'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`font-semibold truncate ${
                      selectedRepo?.id === repo.id ? 'text-[#c9d1d9]' : 'text-[#c9d1d9]'
                    }`}>
                      {repo.name}
                    </span>
                    {repo.private ? (
                      <Lock className="w-3.5 h-3.5 text-[#8b949e] flex-shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-[#8b949e] flex-shrink-0" />
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-[#8b949e] truncate leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
            {isOwner(repo) && (
              <button
                onClick={(e) => handleDeleteClick(e, repo)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#3d2121] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="레포지토리 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default RepositorySelector;

