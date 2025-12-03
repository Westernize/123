import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Repository, FileUpload, UploadHistory, UploadProgress } from '../types/github';
import {
  getRepositories,
  createRepository,
  deleteRepository,
  uploadFilesBatch,
  parseFolderStructure,
} from '../utils/github';
import {
  getUploadHistory,
  addUploadHistory,
  clearUploadHistory,
  removeCachedFiles,
} from '../utils/storage';
import {
  Github,
  Plus,
  Upload,
  FolderPlus,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  BarChart3,
  History,
  X,
} from 'lucide-react';
import FileUploader from './FileUploader';
import RepositorySelector from './RepositorySelector';
import FileBrowser from './FileBrowser';
import UploadProgressComponent from './UploadProgress';
import UploadHistoryComponent from './UploadHistory';
import RepositoryStats from './RepositoryStats';

type TabType = 'files' | 'upload' | 'stats' | 'history';

const Dashboard: React.FC = () => {
  const { user, octokit, logout } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrivate, setFilterPrivate] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const loadRepositories = useCallback(async () => {
    if (!octokit) return;

    try {
      setLoading(true);
      const repos = await getRepositories(octokit);
      setRepositories(repos);
    } catch (error) {
      console.error('레포지토리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [octokit]);

  useEffect(() => {
    loadRepositories();
    setHistory(getUploadHistory());
  }, [loadRepositories]);

  const handleCreateRepository = async (name: string, description: string, isPrivate: boolean) => {
    if (!octokit) return;

    try {
      const newRepo = await createRepository(octokit, name, description, isPrivate);
      setRepositories([newRepo, ...repositories]);
      setSelectedRepo(newRepo);
      setShowCreateRepo(false);
    } catch (error: any) {
      alert(`레포지토리 생성 실패: ${error.message}`);
    }
  };

  const handleDeleteRepository = async (repo: Repository) => {
    if (!octokit || !user) return;

    if (!repo.owner || repo.owner.login !== user.login) {
      const ownerName = repo.owner?.login || repo.full_name.split('/')[0];
      alert(`이 레포지토리는 "${ownerName}"이 소유하고 있어 삭제할 수 없습니다.\n\n레포지토리 소유자만 삭제할 수 있습니다.`);
      return;
    }

    const confirmMessage = `정말로 "${repo.name}" 레포지토리를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const [owner] = repo.full_name.split('/');
      await deleteRepository(octokit, owner, repo.name);

      setRepositories(repositories.filter((r) => r.id !== repo.id));
      if (selectedRepo?.id === repo.id) {
        setSelectedRepo(null);
      }

      // 로컬 캐시도 삭제
      removeCachedFiles(repo.full_name);

      setUploadStatus({
        success: true,
        message: `"${repo.name}" 레포지토리가 성공적으로 삭제되었습니다.`,
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error: any) {
      console.error('삭제 에러 상세:', error);
      alert(`레포지토리 삭제 실패\n\n${error.message}`);
    }
  };

  const handleFileUpload = async (files: File[], commitMessage?: string) => {
    if (!octokit || !selectedRepo || files.length === 0) return;

    try {
      setUploading(true);
      setUploadStatus(null);
      setActiveTab('upload');

      // 진행률 초기화
      const progress: UploadProgress[] = files.map((file) => ({
        fileName: (file as any).webkitRelativePath || file.name,
        progress: 0,
        status: 'pending',
      }));
      setUploadProgress(progress);

      // 폴더 구조 파싱
      const fileUploads: FileUpload[] = await parseFolderStructure(files as any);

      // 진행률 업데이트
      const updateProgress = (index: number, status: UploadProgress['status'], error?: string) => {
        setUploadProgress((prev) => {
          const newProgress = [...prev];
          newProgress[index] = {
            ...newProgress[index],
            status,
            progress: status === 'uploading' ? 50 : status === 'success' ? 100 : 0,
            error,
          };
          return newProgress;
        });
      };

      // 배치 업로드
      const message = commitMessage || `Upload ${files.length} file(s) via GitHub Portfolio Uploader`;
      await uploadFilesBatch(octokit, selectedRepo, fileUploads, message);

      // 모든 파일 성공 처리
      files.forEach((_, index) => {
        updateProgress(index, 'success');
      });

      // 히스토리 추가
      const historyItem: UploadHistory = {
        id: Date.now().toString(),
        repoName: selectedRepo.name,
        repoFullName: selectedRepo.full_name,
        files: fileUploads.map((f) => f.name),
        commitMessage: message,
        timestamp: Date.now(),
        success: true,
      };
      addUploadHistory(historyItem);
      setHistory([historyItem, ...history]);

      setUploadStatus({
        success: true,
        message: `${files.length}개의 파일이 성공적으로 업로드되었습니다!`,
      });

      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error: any) {
      setUploadStatus({
        success: false,
        message: `업로드 실패: ${error.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateSelect = (files: FileUpload[]) => {
    // 템플릿 파일들을 실제 File 객체로 변환하는 것은 복잡하므로,
    // 직접 업로드하도록 처리
    if (!octokit || !selectedRepo) return;

    const uploadTemplateFiles = async () => {
      try {
        setUploading(true);
        await uploadFilesBatch(octokit, selectedRepo, files, 'Add template files');
        setUploadStatus({
          success: true,
          message: '템플릿 파일이 성공적으로 추가되었습니다!',
        });
        setShowTemplates(false);
      } catch (error: any) {
        setUploadStatus({
          success: false,
          message: `템플릿 추가 실패: ${error.message}`,
        });
      } finally {
        setUploading(false);
      }
    };

    uploadTemplateFiles();
  };

  // 필터링된 레포지토리
  const filteredRepositories = repositories.filter((repo) => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPrivate === null || repo.private === filterPrivate;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1117] to-[#161b22]">
      {/* Header */}
      <header className="bg-[#161b22]/95 backdrop-blur-sm border-b border-[#30363d] sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 text-[#58a6ff]" />
              <h1 className="text-xl font-semibold text-[#c9d1d9]">GitHub Portfolio Uploader</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-8 h-8 rounded-full border border-[#30363d]"
                  />
                  <span className="text-sm text-[#c9d1d9] hidden sm:inline font-medium">{user.login}</span>
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#21262d] rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Message */}
        {uploadStatus && (
          <div
            className={`mb-6 flex items-center gap-3 p-4 rounded-xl border ${
              uploadStatus.success
                ? 'bg-[#1c2128] border-[#238636] text-[#3fb950]'
                : 'bg-[#3d2121] border-[#da3633] text-[#f85149]'
            }`}
          >
            {uploadStatus.success ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{uploadStatus.message}</span>
            <button
              onClick={() => setUploadStatus(null)}
              className="ml-auto text-[#8b949e] hover:text-[#c9d1d9]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Repository List */}
          <div className="lg:col-span-1">
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 shadow-lg hover:shadow-xl transition-shadow sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#c9d1d9]">레포지토리</h2>
                <button
                  onClick={() => setShowCreateRepo(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] transition-colors shadow-md font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">새로 만들기</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="검색..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder:text-[#6e7681] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterPrivate(null)}
                    className={`px-2 py-1 text-xs rounded ${
                      filterPrivate === null
                        ? 'bg-[#1f6feb] text-white'
                        : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilterPrivate(false)}
                    className={`px-2 py-1 text-xs rounded ${
                      filterPrivate === false
                        ? 'bg-[#1f6feb] text-white'
                        : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                    }`}
                  >
                    공개
                  </button>
                  <button
                    onClick={() => setFilterPrivate(true)}
                    className={`px-2 py-1 text-xs rounded ${
                      filterPrivate === true
                        ? 'bg-[#1f6feb] text-white'
                        : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                    }`}
                  >
                    비공개
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
                </div>
              ) : (
                <RepositorySelector
                  repositories={filteredRepositories}
                  selectedRepo={selectedRepo}
                  onSelect={setSelectedRepo}
                  onCreate={handleCreateRepository}
                  onDelete={handleDeleteRepository}
                  showCreate={showCreateRepo}
                  onCloseCreate={() => setShowCreateRepo(false)}
                  currentUser={user?.login}
                />
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            {selectedRepo ? (
              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 shadow-lg hover:shadow-xl transition-shadow">
                {/* Repo Header */}
                <div className="mb-6 pb-4 border-b border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#c9d1d9] mb-2">
                        {selectedRepo.name}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                        <a
                          href={selectedRepo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium"
                        >
                          {selectedRepo.full_name}
                        </a>
                        {selectedRepo.description && (
                          <span>{selectedRepo.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-[#30363d]">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'upload'
                          ? 'border-[#1f6feb] text-[#58a6ff]'
                          : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      업로드
                    </button>
                    <button
                      onClick={() => setActiveTab('files')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'files'
                          ? 'border-[#1f6feb] text-[#58a6ff]'
                          : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      파일
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'stats'
                          ? 'border-[#1f6feb] text-[#58a6ff]'
                          : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      통계
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'history'
                          ? 'border-[#1f6feb] text-[#58a6ff]'
                          : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      히스토리
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'upload' && (
                    <div className="space-y-4">
                      {uploadProgress.length > 0 ? (
                        <UploadProgressComponent progress={uploadProgress} />
                      ) : null}
                      <FileUploader
                        onUpload={handleFileUpload}
                        uploading={uploading}
                        showCommitMessage={true}
                        onTemplateSelect={handleTemplateSelect}
                        showTemplates={showTemplates}
                        onToggleTemplates={() => setShowTemplates(!showTemplates)}
                      />
                    </div>
                  )}

                  {activeTab === 'files' && (
                    <FileBrowser
                      octokit={octokit}
                      repo={selectedRepo}
                      onFileDeleted={() => {
                        // 파일 삭제 후 새로고침
                      }}
                      onFileUpdated={() => {
                        // 파일 업데이트 후 새로고침
                      }}
                    />
                  )}

                  {activeTab === 'stats' && (
                    <RepositoryStats octokit={octokit} repo={selectedRepo} />
                  )}

                  {activeTab === 'history' && (
                    <UploadHistoryComponent
                      history={history}
                      onClear={() => {
                        clearUploadHistory();
                        setHistory([]);
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 shadow-lg">
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#21262d] rounded-full mb-4 border border-[#30363d]">
                    <FolderPlus className="w-8 h-8 text-[#58a6ff]" />
                  </div>
                  <p className="text-[#c9d1d9] font-medium mb-2">레포지토리를 선택해주세요</p>
                  <p className="text-sm text-[#8b949e]">
                    왼쪽에서 기존 레포지토리를 선택하거나 새로 만들어주세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
