import React, { useState, useEffect } from 'react';
import { Repository, RepositoryFile } from '../types/github';
import { getFileContent, uploadFile, fileToBase64 } from '../utils/github';
import { X, Save, Loader2 } from 'lucide-react';

interface FileEditorProps {
  file: RepositoryFile;
  octokit: any;
  repo: Repository;
  onClose: () => void;
  onSave: () => void;
}

const FileEditor: React.FC<FileEditorProps> = ({ file, octokit, repo, onClose, onSave }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      setError(err.message || '파일을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!octokit) return;

    try {
      setSaving(true);
      setError(null);

      // 텍스트를 Base64로 인코딩
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      await uploadFile(
        octokit,
        repo,
        {
          name: file.name,
          content: base64Content,
          path: file.path,
        },
        `Update ${file.name}`
      );

      onSave();
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-[#c9d1d9] truncate">편집: {file.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              저장
            </button>
            <button
              onClick={onClose}
              className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-[#3d2121] border border-[#da3633] rounded-lg text-[#f85149] text-sm">
            {error}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] font-mono text-sm resize-none focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
            placeholder="파일 내용을 입력하세요..."
          />
        </div>
      </div>
    </div>
  );
};

export default FileEditor;

