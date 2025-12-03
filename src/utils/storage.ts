import { UploadHistory, RepositoryFile } from '../types/github';

const STORAGE_KEYS = {
  UPLOAD_HISTORY: 'github_uploader_history',
  REPO_FILES: 'github_uploader_repo_files_',
  LAST_SYNC: 'github_uploader_last_sync_',
};

// 업로드 히스토리 관리
export const getUploadHistory = (): UploadHistory[] => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

export const addUploadHistory = (history: UploadHistory): void => {
  const histories = getUploadHistory();
  histories.unshift(history);
  // 최대 100개만 저장
  const limited = histories.slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(limited));
};

export const clearUploadHistory = (): void => {
  localStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
};

// 레포지토리 파일 캐시 관리
export const getCachedFiles = (repoFullName: string): RepositoryFile[] => {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.REPO_FILES + repoFullName);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

export const setCachedFiles = (repoFullName: string, files: RepositoryFile[]): void => {
  localStorage.setItem(STORAGE_KEYS.REPO_FILES + repoFullName, JSON.stringify(files));
};

export const removeCachedFiles = (repoFullName: string): void => {
  localStorage.removeItem(STORAGE_KEYS.REPO_FILES + repoFullName);
};

// 마지막 동기화 시간
export const getLastSync = (repoFullName: string): number | null => {
  const sync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC + repoFullName);
  return sync ? parseInt(sync, 10) : null;
};

export const setLastSync = (repoFullName: string, timestamp: number): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC + repoFullName, timestamp.toString());
};

// 파일 추가 (로컬 캐시에)
export const addFileToCache = (repoFullName: string, file: RepositoryFile): void => {
  const files = getCachedFiles(repoFullName);
  const existingIndex = files.findIndex(f => f.path === file.path);
  
  if (existingIndex >= 0) {
    files[existingIndex] = file;
  } else {
    files.push(file);
  }
  
  setCachedFiles(repoFullName, files);
};

// 파일 삭제 (로컬 캐시에서)
export const removeFileFromCache = (repoFullName: string, path: string): void => {
  const files = getCachedFiles(repoFullName);
  const filtered = files.filter(f => f.path !== path);
  setCachedFiles(repoFullName, filtered);
};

