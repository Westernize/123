import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface CommitMessageModalProps {
  defaultMessage: string;
  onConfirm: (message: string) => void;
  onCancel: () => void;
}

const CommitMessageModal: React.FC<CommitMessageModalProps> = ({
  defaultMessage,
  onConfirm,
  onCancel,
}) => {
  const [message, setMessage] = useState(defaultMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onConfirm(message.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] max-w-2xl w-full">
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-[#c9d1d9]">커밋 메시지</h2>
          <button
            onClick={onCancel}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              커밋 메시지를 입력하세요
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 p-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] resize-none focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
              placeholder="커밋 메시지를 입력하세요..."
              autoFocus
            />
            <p className="mt-2 text-xs text-[#8b949e]">
              변경 사항을 설명하는 커밋 메시지를 작성해주세요.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-[#30363d] rounded-lg text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommitMessageModal;

