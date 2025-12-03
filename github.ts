export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
  stargazers_count?: number;
  forks_count?: number;
  language?: string;
  updated_at?: string;
  created_at?: string;
  size?: number;
}

export interface FileUpload {
  name: string;
  content: string;
  path: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface RepositoryFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  sha: string;
  url: string;
  download_url: string | null;
  content?: string;
  encoding?: string;
}

export interface UploadHistory {
  id: string;
  repoName: string;
  repoFullName: string;
  files: string[];
  commitMessage: string;
  timestamp: number;
  success: boolean;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface RepositoryStats {
  totalFiles: number;
  totalSize: number;
  languages: Record<string, number>;
  recentCommits: number;
  lastUpdated: string;
}

