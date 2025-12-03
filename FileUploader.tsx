import React, { useCallback, useState } from 'react';
import { Upload, File, X, Loader2, Folder } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (files: File[], commitMessage?: string) => void;
  uploading: boolean;
  showCommitMessage?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, uploading, showCommitMessage = false }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (files.length > 0) {
      if (showCommitMessage) {
        setShowCommitModal(true);
      } else {
        onUpload(files);
        setFiles([]);
      }
    }
  }, [files, onUpload, showCommitMessage]);

  const handleCommitConfirm = useCallback((message: string) => {
    onUpload(files, message);
    setFiles([]);
    setShowCommitModal(false);
  }, [files, onUpload]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          isDragging
            ? 'border-[#1f6feb] bg-[#1c2128] scale-[1.02]'
            : 'border-[#30363d] hover:border-[#1f6feb] bg-[#0d1117] hover:bg-[#161b22]'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
        <p className="text-[#c9d1d9] mb-2 font-medium">
          파일을 드래그 앤 드롭하거나 클릭하여 선택하세요
        </p>
        <div className="flex items-center gap-2 justify-center">
          <label className="inline-block px-4 py-2 bg-[#238636] text-white rounded-lg cursor-pointer hover:bg-[#2ea043] transition-colors font-medium shadow-md">
            파일 선택
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <label className="inline-block px-4 py-2 bg-[#1f6feb] text-white rounded-lg cursor-pointer hover:bg-[#0969da] transition-colors font-medium shadow-md">
            폴더 선택
            <input
              type="file"
              multiple
              webkitdirectory=""
              directory=""
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <p className="text-xs text-[#8b949e] mt-2">
          여러 파일 또는 폴더를 선택할 수 있습니다
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="border border-[#30363d] rounded-xl p-4 bg-[#0d1117]">
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">
            선택된 파일 ({files.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#161b22] rounded-lg border border-[#30363d] hover:border-[#1f6feb] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {(file as any).webkitRelativePath ? (
                    <Folder className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />
                  ) : (
                    <File className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#c9d1d9] truncate font-medium">{file.name}</p>
                    <p className="text-xs text-[#8b949e]">
                      {(file as any).webkitRelativePath || formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-[#8b949e] hover:text-[#f85149] transition-colors p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-[#238636] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                업로드하기
              </>
            )}
          </button>
        </div>
      )}

      {/* Commit Message Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
              <h2 className="text-lg font-semibold text-[#c9d1d9]">커밋 메시지</h2>
              <button
                onClick={() => setShowCommitModal(false)}
                className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const message = formData.get('message') as string;
                if (message.trim()) {
                  handleCommitConfirm(message.trim());
                }
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                  커밋 메시지를 입력하세요
                </label>
                <textarea
                  name="message"
                  defaultValue={`Upload ${files.length} file(s)`}
                  className="w-full h-32 p-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] resize-none focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
                  placeholder="커밋 메시지를 입력하세요..."
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommitModal(false)}
                  className="px-4 py-2 border border-[#30363d] rounded-lg text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] transition-colors"
                >
                  업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

