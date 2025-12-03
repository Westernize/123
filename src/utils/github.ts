import { Octokit } from '@octokit/rest';
import { Repository, FileUpload, RepositoryFile, RepositoryStats } from '../types/github';

// GitHub OAuth 인증 URL 생성
export const getGitHubAuthUrl = (): string => {
  const clientId = (import.meta as any).env?.VITE_GITHUB_CLIENT_ID || '';
  const redirectUri = `${window.location.origin}/auth/callback`;
  const scope = 'repo';
  const state = Math.random().toString(36).substring(7);
  
  sessionStorage.setItem('github_oauth_state', state);
  
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
};

// OAuth 토큰 교환 (실제로는 백엔드에서 처리해야 하지만, MVP에서는 간단하게 처리)
export const exchangeCodeForToken = async (_code: string): Promise<string> => {
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
    updated_at: repo.updated_at || undefined,
    created_at: repo.created_at || undefined,
    size: repo.size || undefined,
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
  // 배치 업로드가 복잡하므로, 실패 시 순차 업로드로 폴백
  try {
    const [owner] = repo.full_name.split('/');
    const branch = repo.default_branch;

    // 현재 브랜치의 최신 커밋 가져오기
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo: repo.name,
      ref: `heads/${branch}`,
    });

    const commitSha = refData.object.sha;

    // 커밋에서 트리 SHA 가져오기
    let treeSha: string | null = null;
    let baseTree: any = { tree: [] };

    if (commitSha) {
      try {
        const { data: commitData } = await octokit.git.getCommit({
          owner,
          repo: repo.name,
          commit_sha: commitSha,
        });

        treeSha = commitData.tree.sha;

        // 현재 트리 가져오기 (빈 레포지토리일 수 있음)
        try {
          const { data } = await octokit.git.getTree({
            owner,
            repo: repo.name,
            tree_sha: treeSha,
            recursive: true as any,
          });
          baseTree = data;
        } catch (treeError: any) {
          // 트리가 없거나 404인 경우 빈 트리로 처리
          if (treeError.status === 404) {
            console.warn('트리를 찾을 수 없습니다. 빈 레포지토리일 수 있습니다.');
            baseTree = { tree: [] };
            treeSha = null;
          } else {
            throw treeError;
          }
        }
      } catch (commitError: any) {
        // 커밋이 없는 경우 (빈 레포지토리)
        if (commitError.status === 404) {
          console.warn('커밋을 찾을 수 없습니다. 빈 레포지토리입니다.');
          treeSha = null;
          baseTree = { tree: [] };
        } else {
          throw commitError;
        }
      }
    } else {
      // ref가 없는 경우 (완전히 빈 레포지토리)
      treeSha = null;
      baseTree = { tree: [] };
    }

  // 기존 파일의 SHA 맵 생성
  const existingFiles = new Map<string, string>();
  if (baseTree.tree) {
    for (const item of baseTree.tree) {
      if (item.type === 'blob' && item.path && item.sha) {
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
    ...(baseTree.tree?.filter((item: any) => {
      if (item.type !== 'blob' || !item.path) return true;
      return !files.some((f) => f.path === item.path);
    }) || []),
    ...blobs,
  ];

  const treeData = treeItems.map((item: any) => {
    if ('path' in item && item.path && 'sha' in item && item.sha) {
      return {
        path: item.path,
        mode: 'mode' in item ? item.mode : ('100644' as const),
        type: ('type' in item ? item.type : 'blob') as 'blob' | 'tree',
        sha: item.sha,
      };
    }
    return item as any;
  }).filter((item: any) => item.path && item.sha);

  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo: repo.name,
    tree: treeData,
    ...(treeSha ? { base_tree: treeSha } : {}),
  });

    // 새 커밋 생성
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo: repo.name,
      message,
      tree: newTree.sha,
      parents: commitSha ? [commitSha] : [],
    });

    // 브랜치 업데이트
    try {
      await octokit.git.updateRef({
        owner,
        repo: repo.name,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
    } catch (refError: any) {
      // ref 업데이트 실패 시 최신 ref를 다시 가져와서 재시도
      const { data: latestRefData } = await octokit.git.getRef({
        owner,
        repo: repo.name,
        ref: `heads/${branch}`,
      });

      if (latestRefData.object.sha !== commitSha) {
        // 최신 커밋이 변경되었으므로 순차 업로드로 폴백
        throw new Error('REF_CHANGED');
      } else {
        throw refError;
      }
    }
  } catch (error: any) {
    // 배치 업로드 실패 시 순차 업로드로 폴백
    if (
      error.message?.includes('not a fast forward') ||
      error.message === 'REF_CHANGED' ||
      error.status === 422 ||
      error.message?.includes('Update is not a fast forward')
    ) {
      console.warn('배치 업로드 실패, 순차 업로드로 전환:', error.message);
      // 순차 업로드로 폴백
      for (const file of files) {
        await uploadFile(octokit, repo, file, message);
      }
    } else {
      throw error;
    }
  }
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
  
  // 폴더 선택인지 확인 (webkitRelativePath가 있는지)
  const isFolderUpload = files.length > 0 && (files[0] as any).webkitRelativePath;
  
  // webkitRelativePath는 선택한 폴더를 기준으로 상대 경로를 제공
  // 예: "AirProject" 폴더를 선택하면
  // - "AirProject/.settings/file.txt" → webkitRelativePath는 "AirProject/.settings/file.txt"
  // 따라서 폴더 이름이 이미 포함되어 있음
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let path: string;
    
    if (isFolderUpload && (file as any).webkitRelativePath) {
      // 폴더 선택: webkitRelativePath 사용 (폴더 구조 유지)
      // webkitRelativePath는 선택한 폴더 이름을 포함한 전체 경로
      // 예: "AirProject" 폴더를 선택하면 "AirProject/.settings/file.txt" 형태
      path = (file as any).webkitRelativePath;
    } else {
      // 일반 파일 선택: 파일명만 사용
      path = file.name;
    }
    
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
    // 캐시 방지를 위한 타임스탬프 추가
    const { data } = await octokit.repos.getContent({
      owner,
      repo: repo.name,
      path,
      headers: {
        'If-None-Match': '', // ETag 무시 (항상 최신 데이터 요청)
      },
      t: Date.now(), // 쿼리 파라미터로 타임스탬프 추가 (캐시 방지)
    } as any);

    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: (item.type === 'dir' ? 'dir' : 'file') as 'dir' | 'file',
        size: item.size || 0,
        sha: item.sha,
        url: item.url,
        download_url: item.download_url,
      }));
    } else {
      const isDir = 'type' in data && (data as any).type === 'dir';
      return [{
        name: data.name,
        path: data.path,
        type: (isDir ? 'dir' : 'file') as 'dir' | 'file',
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

// Base64를 UTF-8 문자열로 디코딩
const base64ToUtf8 = (base64: string): string => {
  try {
    // Base64 디코딩
    const binaryString = atob(base64.replace(/\s/g, ''));
    // UTF-8 바이트 배열로 변환
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    // UTF-8 디코딩
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    // 폴백: 기존 방식 사용
    return decodeURIComponent(escape(atob(base64.replace(/\s/g, ''))));
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

  if ('encoding' in data && data.encoding === 'base64' && 'content' in data && data.content) {
    return base64ToUtf8(data.content);
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
  
  try {
    // 기존 파일의 SHA 가져오기
    let sha: string;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repo.name,
        path,
        headers: {
          'If-None-Match': '',
        },
      } as any);

      if (Array.isArray(data)) {
        throw new Error('경로가 디렉토리입니다.');
      }
      
      sha = data.sha;
    } catch (error: any) {
      // 파일이 이미 없는 경우 성공으로 간주 (또는 무시)
      if (error.status === 404) {
        console.warn('삭제하려는 파일이 이미 존재하지 않습니다.');
        return;
      }
      throw error;
    }

    await octokit.repos.deleteFile({
      owner,
      repo: repo.name,
      path,
      message,
      sha,
      branch: repo.default_branch,
    });
  } catch (error: any) {
    // 파일이 이미 삭제된 경우(404)나 SHA 불일치(409) 등은 무시하거나 별도 처리
    if (error.status === 404) {
      console.warn('파일이 이미 삭제되었습니다.');
      return;
    }
    console.error('파일 삭제 실패:', error);
    throw new Error(error.message || '파일 삭제 중 오류가 발생했습니다.');
  }
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

