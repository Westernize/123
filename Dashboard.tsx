import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Repository, FileUpload } from '../types/github';
import { getRepositories, createRepository, deleteRepository, uploadFiles, fileToBase64 } from '../utils/github';
import { Github, Plus, Upload, FolderPlus, LogOut, User, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import FileUploader from './FileUploader';
import RepositorySelector from './RepositorySelector';

const Dashboard: React.FC = () => {
  const { user, octokit, logout } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);

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
    
    // 디버깅: owner 정보 확인
    console.log('삭제 시도:', {
      repoOwner: repo.owner?.login,
      currentUser: user.login,
      fullName: repo.full_name,
      ownerMatch: repo.owner?.login === user.login
    });
    
    // 소유자 확인 (owner 정보가 없는 경우도 처리)
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
      
      // 삭제된 레포지토리를 목록에서 제거
      setRepositories(repositories.filter(r => r.id !== repo.id));
      
      // 선택된 레포지토리가 삭제된 경우 선택 해제
      if (selectedRepo?.id === repo.id) {
        setSelectedRepo(null);
      }
      
      // 성공 메시지
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

  const handleFileUpload = async (files: File[]) => {
    if (!octokit || !selectedRepo || files.length === 0) return;

    try {
      setUploading(true);
      setUploadStatus(null);

      const fileUploads: FileUpload[] = await Promise.all(
        files.map(async (file) => {
          const content = await fileToBase64(file);
          return {
            name: file.name,
            content,
            path: file.name, // 간단하게 루트에 업로드
          };
        })
      );

      await uploadFiles(octokit, selectedRepo, fileUploads, `Upload ${files.length} file(s) via GitHub Portfolio Uploader`);

      setUploadStatus({
        success: true,
        message: `${files.length}개의 파일이 성공적으로 업로드되었습니다!`,
      });

      // 3초 후 상태 메시지 제거
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1117] to-[#161b22]">
      {/* Header */}
      <header className="bg-[#161b22]/95 backdrop-blur-sm border-b border-[#30363d] sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 text-[#58a6ff]" />
              <h1 className="text-xl font-semibold text-[#c9d1d9]">포트폴리오 업로더</h1>
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Repository List */}
          <div className="lg:col-span-1">
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 shadow-lg hover:shadow-xl transition-shadow">
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

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
                </div>
              ) : (
                <RepositorySelector
                  repositories={repositories}
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

          {/* Right Content - File Upload */}
          <div className="lg:col-span-2">
            <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 shadow-lg hover:shadow-xl transition-shadow">
              {selectedRepo ? (
                <>
                  <div className="mb-6 pb-4 border-b border-[#30363d]">
                    <h2 className="text-lg font-semibold text-[#c9d1d9] mb-3">
                      파일 업로드
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                      <FolderPlus className="w-4 h-4 text-[#8b949e]" />
                      <span className="text-[#8b949e]">레포지토리: </span>
                      <a
                        href={selectedRepo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium"
                      >
                        {selectedRepo.full_name}
                      </a>
                    </div>
                  </div>
                  <FileUploader
                    onUpload={handleFileUpload}
                    uploading={uploading}
                  />
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#21262d] rounded-full mb-4 border border-[#30363d]">
                    <Upload className="w-8 h-8 text-[#58a6ff]" />
                  </div>
                  <p className="text-[#c9d1d9] font-medium mb-2">레포지토리를 선택해주세요</p>
                  <p className="text-sm text-[#8b949e]">
                    왼쪽에서 기존 레포지토리를 선택하거나 새로 만들어주세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

