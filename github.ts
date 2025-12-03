import { Octokit } from '@octokit/rest';
import { Repository, FileUpload, RepositoryFile, RepositoryStats } from '../types/github';

// GitHub OAuth 인증 URL 생성
export const getGitHubAuthUrl = (): string => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scope = 'repo';
  const state = Math.random().toString(36).substring(7);
  
  sessionStorage.setItem('github_oauth_state', state);
  
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
};

// OAuth 토큰 교환 (실제로는 백엔드에서 처리해야 하지만, MVP에서는 간단하게 처리)
export const exchangeCodeForToken = async (code: string): Promise<string> => {
  // 주의: 실제 프로덕션에서는 백엔드 서버를 통해 토큰을 교환해야 합니다.
  // 여기서는 간단한 예시로, 사용자가 Personal Access Token을 직접 입력하는 방식도 고려할 수 있습니다.
  // 또는 GitHub OAuth Device Flow를 사용할 수 있습니다.
  
  // 임시: 로컬 스토리지에서 토큰 가져오기 (실제로는 OAuth 플로우 완료 후 저장)
  const token = localStorage.getItem('github_token');
  if (token) return token;
  
  throw new Error('GitHub 토큰이 필요합니다. Personal Access Token을 설정해주세요.');
};

// Octokit 인스턴스 생성
export const createOctokit = (token: string): Octokit => {
  return new Octokit({
    auth: token,
  });
};

// 레포지토리 목록 가져오기
export const getRepositories = async (octokit: Octokit): Promise<Repository[]> => {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });
  
  return data.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    private: repo.private,
    html_url: repo.html_url,
    default_branch: repo.default_branch || 'main',
    owner: {
      login: repo.owner.login,
    },
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language || undefined,
    updated_at: repo.updated_at,
    created_at: repo.created_at,
    size: repo.size,
  }));
};

// 새 레포지토리 생성
export const createRepository = async (
  octokit: Octokit,
  name: string,
  description?: string,
  isPrivate: boolean = false
): Promise<Repository> => {
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: true,
  });
  
  return {
    id: data.id,
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    private: data.private,
    html_url: data.html_url,
    default_branch: data.default_branch || 'main',
    owner: {
      login: data.owner.login,
    },
  };
};

// 파일 업로드 (커밋)
export const uploadFile = async (
  octokit: Octokit,
  repo: Repository,
  file: FileUpload,
  message: string = 'Upload file via GitHub Portfolio Uploader'
): Promise<void> => {
  try {
    // 기존 파일이 있는지 확인
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner: repo.full_name.split('/')[0],
        repo: repo.name,
        path: file.path,
      });
      
      if (Array.isArray(data)) {
        throw new Error('경로가 디렉토리입니다.');
      }
      
      sha = data.sha;
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }
    
    // 파일 업로드
    await octokit.repos.createOrUpdateFileContents({
      owner: repo.full_name.split('/')[0],
      repo: repo.name,
      path: file.path,
      message,
      content: file.content,
      sha,
      branch: repo.default_branch,
    });
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    throw error;
  }
};

// 여러 파일 업로드 (순차적)
export const uploadFiles = async (
  octokit: Octokit,
  repo: Repository,
  files: FileUpload[],
  message: string = 'Upload files via GitHub Portfolio Uploader'
): Promise<void> => {
  for (const file of files) {
    await uploadFile(octokit, repo, file, message);
  }
};

// 배치 업로드 (Tree API 사용 - 최적화)
export const uploadFilesBatch = async (
  octokit: Octokit,
  repo: Repository,
  files: FileUpload[],
  message: string = 'Upload files via GitHub Portfolio Uploader'
): Promise<void> => {
  const [owner] = repo.full_name.split('/');
  const branch = repo.default_branch;

  // 현재 브랜치의 최신 커밋 가져오기
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo: repo.name,
    ref: `heads/${branch}`,
  });

  const baseSha = refData.object.sha;

  // 현재 트리 가져오기
  const { data: baseTree } = await octokit.git.getTree({
    owner,
    repo: repo.name,
    tree_sha: baseSha,
    recursive: true,
  });

  // 기존 파일의 SHA 맵 생성
  const existingFiles = new Map<string, string>();
  if (baseTree.tree) {
    for (const item of baseTree.tree) {
      if (item.type === 'blob' && item.path) {
        existingFiles.set(item.path, item.sha);
      }
    }
  }

  // 새 파일들을 Blob으로 생성
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo: repo.name,
        content: file.content,
        encoding: 'base64',
      });
      return { path: file.path, sha: blob.sha, mode: '100644' as const, type: 'blob' as const };
    })
  );

  // 트리 생성 (기존 파일 + 새 파일)
  const treeItems = [
    ...(baseTree.tree?.filter((item) => {
      if (item.type !== 'blob' || !item.path) return true;
      return !files.some((f) => f.path === item.path);
    }) || []),
    ...blobs,
  ];

  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo: repo.name,
    tree: treeItems as any,
    base_tree: baseSha,
  });

  // 새 커밋 생성
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo: repo.name,
    message,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 브랜치 업데이트
  await octokit.git.updateRef({
    owner,
    repo: repo.name,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });
};

// 레포지토리 삭제
export const deleteRepository = async (
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<void> => {
  try {
    console.log('삭제 API 호출:', { owner, repo });
    const response = await octokit.repos.delete({
      owner,
      repo,
    });
    console.log('삭제 성공:', response);
  } catch (error: any) {
    console.error('레포지토리 삭제 실패 상세:', {
      status: error.status,
      message: error.message,
      owner,
      repo
    });
    
    // 에러 메시지를 한국어로 변환
    if (error.status === 403) {
      throw new Error('이 레포지토리를 삭제할 권한이 없습니다. 레포지토리 소유자만 삭제할 수 있습니다.');
    } else if (error.status === 404) {
      throw new Error('레포지토리를 찾을 수 없습니다.');
    } else if (error.message?.includes('admin rights') || error.message?.includes('Must have admin')) {
      throw new Error('이 레포지토리를 삭제할 권한이 없습니다. 레포지토리 소유자만 삭제할 수 있습니다.');
    } else if (error.message) {
      throw new Error(`삭제 실패: ${error.message}`);
    } else {
      throw new Error('레포지토리 삭제에 실패했습니다. 권한을 확인해주세요.');
    }
  }
};

// 파일을 Base64로 인코딩
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64, 부분 제거
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 폴더 구조 파싱 (webkitRelativePath 사용)
export const parseFolderStructure = async (files: FileList): Promise<FileUpload[]> => {
  const fileUploads: FileUpload[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = (file as any).webkitRelativePath || file.name;
    const content = await fileToBase64(file);
    
    fileUploads.push({
      name: file.name,
      content,
      path,
    });
  }
  
  return fileUploads;
};

// 레포지토리 파일 목록 가져오기
export const getRepositoryFiles = async (
  octokit: Octokit,
  repo: Repository,
  path: string = ''
): Promise<RepositoryFile[]> => {
  const [owner] = repo.full_name.split('/');
  
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo: repo.name,
      path,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        size: item.size || 0,
        sha: item.sha,
        url: item.url,
        download_url: item.download_url,
      }));
    } else {
      return [{
        name: data.name,
        path: data.path,
        type: data.type === 'dir' ? 'dir' : 'file',
        size: data.size || 0,
        sha: data.sha,
        url: data.url,
        download_url: data.download_url,
        content: 'content' in data ? data.content : undefined,
        encoding: 'encoding' in data ? data.encoding : undefined,
      }];
    }
  } catch (error: any) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
};

// 파일 내용 가져오기
export const getFileContent = async (
  octokit: Octokit,
  repo: Repository,
  path: string
): Promise<string> => {
  const [owner] = repo.full_name.split('/');
  
  const { data } = await octokit.repos.getContent({
    owner,
    repo: repo.name,
    path,
  });

  if (Array.isArray(data)) {
    throw new Error('경로가 디렉토리입니다.');
  }

  if (data.encoding === 'base64' && data.content) {
    return atob(data.content.replace(/\s/g, ''));
  }

  throw new Error('파일 내용을 가져올 수 없습니다.');
};

// 파일 삭제
export const deleteFile = async (
  octokit: Octokit,
  repo: Repository,
  path: string,
  message: string = 'Delete file via GitHub Portfolio Uploader'
): Promise<void> => {
  const [owner] = repo.full_name.split('/');
  
  // 기존 파일의 SHA 가져오기
  const { data } = await octokit.repos.getContent({
    owner,
    repo: repo.name,
    path,
  });

  if (Array.isArray(data)) {
    throw new Error('경로가 디렉토리입니다.');
  }

  await octokit.repos.deleteFile({
    owner,
    repo: repo.name,
    path,
    message,
    sha: data.sha,
    branch: repo.default_branch,
  });
};

// 파일 이름 변경
export const renameFile = async (
  octokit: Octokit,
  repo: Repository,
  oldPath: string,
  newPath: string,
  message: string = 'Rename file via GitHub Portfolio Uploader'
): Promise<void> => {
  // 파일 내용 가져오기
  const content = await getFileContent(octokit, repo, oldPath);
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  
  // 새 경로에 파일 생성
  await uploadFile(octokit, repo, {
    name: newPath.split('/').pop() || newPath,
    content: base64Content,
    path: newPath,
  }, message);
  
  // 기존 파일 삭제
  await deleteFile(octokit, repo, oldPath, message);
};

// 레포지토리 통계 가져오기
export const getRepositoryStats = async (
  octokit: Octokit,
  repo: Repository
): Promise<RepositoryStats> => {
  const [owner] = repo.full_name.split('/');
  
  // 파일 목록 가져오기 (재귀적)
  const getAllFiles = async (path: string = ''): Promise<RepositoryFile[]> => {
    const files = await getRepositoryFiles(octokit, repo, path);
    const allFiles: RepositoryFile[] = [];
    
    for (const file of files) {
      if (file.type === 'dir') {
        const subFiles = await getAllFiles(file.path);
        allFiles.push(...subFiles);
      } else {
        allFiles.push(file);
      }
    }
    
    return allFiles;
  };

  const allFiles = await getAllFiles();
  
  // 언어 통계
  const languages: Record<string, number> = {};
  let totalSize = 0;
  
  for (const file of allFiles) {
    totalSize += file.size;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext) {
      const langMap: Record<string, string> = {
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'jsx': 'JavaScript',
        'tsx': 'TypeScript',
        'py': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        'cs': 'C#',
        'go': 'Go',
        'rs': 'Rust',
        'php': 'PHP',
        'rb': 'Ruby',
        'swift': 'Swift',
        'kt': 'Kotlin',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'json': 'JSON',
        'xml': 'XML',
        'md': 'Markdown',
        'yml': 'YAML',
        'yaml': 'YAML',
      };
      
      const lang = langMap[ext] || ext.toUpperCase();
      languages[lang] = (languages[lang] || 0) + 1;
    }
  }

  // 최근 커밋 수
  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo: repo.name,
    per_page: 1,
  });

  return {
    totalFiles: allFiles.length,
    totalSize,
    languages,
    recentCommits: commits.length,
    lastUpdated: repo.updated_at || new Date().toISOString(),
  };
};

