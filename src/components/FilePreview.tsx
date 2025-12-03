import React, { useState, useEffect } from 'react';
import { Repository, RepositoryFile } from '../types/github';
import { getFileContent } from '../utils/github';
import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FilePreviewProps {
  file: RepositoryFile;
  octokit: any;
  repo: Repository;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, octokit, repo, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [file]);

  const loadContent = async () => {
    if (!octokit || file.type === 'dir') return;

    try {
      setLoading(true);
      setError(null);
      const fileContent = await getFileContent(octokit, repo, file.path);
      setContent(fileContent);
    } catch (err: any) {
      // 404 오류는 파일이 삭제되었음을 의미
      if (err.status === 404 || err.message?.includes('Not Found')) {
        setError('파일이 삭제되었거나 찾을 수 없습니다.');
        // 파일이 삭제된 경우 자동으로 닫기
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(err.message || '파일을 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isImage = (fileName: string): boolean => {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'];
    return imageExts.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const isMarkdown = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown');
  };

  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yml': 'yaml',
      'yaml': 'yaml',
      'sh': 'bash',
      'bash': 'bash',
    };
    return langMap[ext || ''] || 'text';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 max-w-4xl w-full">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 max-w-4xl w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#c9d1d9]">{file.name}</h2>
            <button
              onClick={onClose}
              className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-[#f85149]">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-[#c9d1d9] truncate">{file.name}</h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isImage(file.name) && file.download_url ? (
            <div className="flex items-center justify-center">
              <img
                src={file.download_url}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : isMarkdown(file.name) ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden">
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={getLanguage(file.name)}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: '#0d1117',
                }}
              >
                {content}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;

