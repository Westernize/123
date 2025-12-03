import React, { useState, useEffect } from 'react';
import { Repository, RepositoryFile } from '../types/github';
import { getRepositoryFiles, getFileContent, deleteFile, uploadFile, fileToBase64 } from '../utils/github';
import { getCachedFiles, setCachedFiles, removeFileFromCache } from '../utils/storage';
import { File, Folder, Trash2, Edit2, Eye, Download, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
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
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<RepositoryFile | null>(null);
  const [editFile, setEditFile] = useState<RepositoryFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [octokit, repo, currentPath]);

  const loadFiles = async () => {
    if (!octokit) return;
    
    try {
      setLoading(true);
      const repoFiles = await getRepositoryFiles(octokit, repo, currentPath);
      
      // 로컬 캐시와 병합
      const cached = getCachedFiles(repo.full_name);
      const cachedMap = new Map(cached.map(f => [f.path, f]));
      
      const merged = repoFiles.map(file => {
        const cachedFile = cachedMap.get(file.path);
        return cachedFile || file;
      });
      
      setFiles(merged);
      setCachedFiles(repo.full_name, merged);
    } catch (error) {
      console.error('파일 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: RepositoryFile) => {
    if (!octokit || file.type === 'dir') return;
    
    if (!window.confirm(`정말로 "${file.name}" 파일을 삭제하시겠습니까?`)) return;

    try {
      setDeleting(file.path);
      await deleteFile(octokit, repo, file.path, `Delete ${file.name}`);
      
      // 로컬 캐시에서도 삭제
      removeFileFromCache(repo.full_name, file.path);
      
      // 파일 목록 새로고침
      await loadFiles();
      onFileDeleted?.();
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handlePreview = async (file: RepositoryFile) => {
    if (file.type === 'dir') {
      toggleDir(file.path);
      return;
    }
    
    setPreviewFile(file);
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const navigateToDir = (path: string) => {
    setCurrentPath(path);
    setExpandedDirs(new Set());
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
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {expandedDirs.has(file.path) ? (
                        <ChevronDown className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
                      )}
                      <Folder className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />
                      <span className="text-[#c9d1d9] font-medium truncate">{file.name}</span>
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
          onClose={() => setEditFile(null)}
          onSave={async () => {
            await loadFiles();
            onFileUpdated?.();
            setEditFile(null);
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

