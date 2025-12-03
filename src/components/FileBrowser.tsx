import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Repository, RepositoryFile } from '../types/github';
import { getRepositoryFiles, deleteFile } from '../utils/github';
import { setCachedFiles, removeFileFromCache } from '../utils/storage';
import { File, Folder, Trash2, Edit2, Eye, Download, Loader2 } from 'lucide-react';
import FilePreview from './FilePreview';
import FileEditor from './FileEditor';

interface FileBrowserProps {
  octokit: any;
  repo: Repository;
  onFileDeleted?: () => void;
  onFileUpdated?: () => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ octokit, repo, onFileDeleted, onFileUpdated }) => {
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<RepositoryFile | null>(null);
  const [editFile, setEditFile] = useState<RepositoryFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  // 삭제된 파일 추적용 Ref (클로저 문제 해결)
  const deletedPathsRef = useRef<Set<string>>(new Set());

  // currentPath를 ref로 관리하여 비동기 함수나 클로저 내에서 항상 최신 값을 참조하도록 함
  const currentPathRef = useRef(currentPath);
  
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  // useCallback을 사용하여 함수 재생성 최소화 및 의존성 관리
  const loadFiles = useCallback(async (showLoading = true) => {
    if (!octokit) return;
    
    try {
      if (showLoading) setLoading(true);
      const pathToCheck = currentPathRef.current;
      console.log('파일 목록 요청 경로:', pathToCheck || 'root');
      const repoFiles = await getRepositoryFiles(octokit, repo, pathToCheck);
      console.log('받아온 파일 목록:', repoFiles);
      
      // 경로가 바뀌었을 수 있으므로 체크 (비동기 처리 중 네비게이션 발생 시)
      if (currentPathRef.current !== pathToCheck) return;

      // 삭제된 파일은 결과에서 제외 (서버 반영 지연 대응)
      const filteredFiles = repoFiles.filter(f => !deletedPathsRef.current.has(f.path));

      setFiles(filteredFiles);
      setCachedFiles(repo.full_name, filteredFiles);
    } catch (error: any) {
      console.error('파일 로드 실패:', error);
      if (error.status === 404) {
        setFiles([]);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [octokit, repo]);

  useEffect(() => {
    // 경로 변경 시 삭제 목록 초기화 (다른 폴더로 이동했으므로)
    deletedPathsRef.current.clear();
    setFiles([]); // 이전 파일 목록 비우기 (깜빡임 방지)
    setLoading(true); // 로딩 상태로 전환
    loadFiles(true);
  }, [repo.full_name, currentPath, loadFiles]); // octokit 제외 (무한 루프 방지)

  const handleDelete = async (file: RepositoryFile) => {
    if (!octokit || file.type === 'dir') return;
    
    if (!window.confirm(`정말로 "${file.name}" 파일을 삭제하시겠습니까?`)) return;

    // 낙관적 업데이트: 서버 응답을 기다리지 않고 UI에서 즉시 제거
    const previousFiles = [...files];
    setFiles((prev) => prev.filter((f) => f.path !== file.path));
    
    // 삭제 목록에 추가 (Ref 사용)
    deletedPathsRef.current.add(file.path);

    try {
      setDeleting(file.path);
      
      // 미리보기나 편집 중인 파일이면 닫기
      if (previewFile?.path === file.path) {
        setPreviewFile(null);
      }
      if (editFile?.path === file.path) {
        setEditFile(null);
      }
      
      await deleteFile(octokit, repo, file.path, `Delete ${file.name}`);
      
      // 로컬 캐시에서도 삭제
      removeFileFromCache(repo.full_name, file.path);
      
      onFileDeleted?.();
      
      // 백그라운드에서 파일 목록 동기화 지연 시간을 늘림 (5초)
      // GitHub API의 eventual consistency 고려
      setTimeout(() => {
        loadFiles(false).catch(() => {}); // 로딩 표시 없이 조용히 갱신
      }, 5000);
    } catch (error: any) {
      // 404 에러(이미 삭제됨)는 무시하고 UI 유지
      if (error.message?.includes('Not Found') || error.status === 404) {
        return;
      }
      
      // 진짜 실패 시 롤백
      setFiles(previousFiles);
      // 삭제 목록에서 제거
      deletedPathsRef.current.delete(file.path);
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handlePreview = async (file: RepositoryFile) => {
    if (file.type === 'dir') {
      // 디렉토리 클릭 시 해당 디렉토리로 이동
      navigateToDir(file.path);
      return;
    }
    
    setPreviewFile(file);
  };

  const navigateToDir = (path: string) => {
    // 경로 끝의 슬래시 제거 (GitHub API 호환성)
    const cleanPath = path.replace(/\/$/, '');
    setCurrentPath(cleanPath);
  };

  const getPathParts = () => {
    if (!currentPath) return [];
    return currentPath.split('/').filter(Boolean);
  };

  const navigateUp = (index: number) => {
    const parts = getPathParts();
    const newPath = parts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {currentPath && (
        <div className="flex items-center gap-2 text-sm text-[#8b949e]">
          <button
            onClick={() => navigateToDir('')}
            className="hover:text-[#58a6ff] transition-colors"
          >
            루트
          </button>
          {getPathParts().map((part, index) => (
            <React.Fragment key={index}>
              <span>/</span>
              <button
                onClick={() => navigateUp(index)}
                className="hover:text-[#58a6ff] transition-colors"
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* File List */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#0d1117]">
        {files.length === 0 ? (
          <div className="text-center py-12 text-[#8b949e]">
            <File className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
            <p>파일이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {files.map((file) => (
              <div
                key={file.path}
                className="group flex items-center gap-3 p-3 hover:bg-[#161b22] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {file.type === 'dir' ? (
                    <button
                      onClick={() => handlePreview(file)}
                      className="flex items-center gap-2 flex-1 text-left hover:text-[#58a6ff] transition-colors"
                    >
                      <Folder className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />
                      <span className="text-[#c9d1d9] font-medium truncate">{file.name}</span>
                      <span className="text-xs text-[#6e7681]">/</span>
                    </button>
                  ) : (
                    <>
                      <File className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
                      <button
                        onClick={() => handlePreview(file)}
                        className="text-[#c9d1d9] hover:text-[#58a6ff] transition-colors truncate flex-1 text-left"
                      >
                        {file.name}
                      </button>
                    </>
                  )}
                  <span className="text-xs text-[#8b949e]">
                    {file.size > 0 ? formatFileSize(file.size) : ''}
                  </span>
                </div>
                
                {file.type === 'file' && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.download_url && (
                      <a
                        href={file.download_url}
                        download
                        className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handlePreview(file)}
                      className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                      title="미리보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditFile(file)}
                      className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                      title="편집"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={deleting === file.path}
                      className="p-1.5 text-[#8b949e] hover:text-[#f85149] transition-colors disabled:opacity-50"
                      title="삭제"
                    >
                      {deleting === file.path ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          octokit={octokit}
          repo={repo}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* File Editor Modal */}
      {editFile && (
        <FileEditor
          file={editFile}
          octokit={octokit}
          repo={repo}
          onClose={() => {
            setEditFile(null);
            // 편집 취소 시에는 새로고침 하지 않음
          }}
          onSave={async () => {
            // 저장(수정) 시
            removeFileFromCache(repo.full_name, editFile.path);
            await loadFiles(false); // 로딩 표시 없이 갱신
            onFileUpdated?.();
          }}
          onDelete={() => {
            // 에디터에서 삭제 시 UI 즉시 반영
            const pathToDelete = editFile.path;
            setFiles((prev) => prev.filter((f) => f.path !== pathToDelete));
            
            // 삭제 목록에 추가
            deletedPathsRef.current.add(pathToDelete);

            removeFileFromCache(repo.full_name, pathToDelete);
            onFileDeleted?.();
            setEditFile(null);
            // 백그라운드 동기화 지연
            setTimeout(() => loadFiles(false).catch(() => {}), 5000);
          }}
        />
      )}
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default FileBrowser;

