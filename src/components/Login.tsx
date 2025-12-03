import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Github, Key, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(token.trim());
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다. 토큰을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] px-4 py-12">
      <div className="max-w-md w-full bg-[#161b22] rounded-2xl shadow-2xl border border-[#30363d] p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1f6feb] to-[#0969da] rounded-2xl mb-6 shadow-lg">
            <Github className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-3 tracking-tight">
            GitHub 포트폴리오 업로더
          </h1>
          <p className="text-[#8b949e] text-base leading-relaxed">
            명령어 없이 간편하게<br />GitHub에 파일을 업로드하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="token" className="block text-sm font-semibold text-[#c9d1d9] mb-2.5">
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8b949e]" />
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-11 pr-4 py-3.5 border border-[#30363d] rounded-xl focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] transition-all text-[#c9d1d9] placeholder:text-[#6e7681] bg-[#0d1117]"
                required
              />
            </div>
            <p className="mt-3 text-xs text-[#8b949e] leading-relaxed">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=GitHub%20Portfolio%20Uploader"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#58a6ff] hover:text-[#79c0ff] hover:underline font-medium"
              >
                GitHub에서 토큰 생성하기
              </a>
              <span className="text-[#6e7681]"> · </span>
              <span className="text-[#8b949e]">repo 권한 필요</span>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-[#3d2121] border border-[#da3633] rounded-xl text-[#f85149] text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full bg-[#238636] text-white py-3.5 rounded-xl font-semibold hover:bg-[#2ea043] active:bg-[#238636] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                로그인 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#30363d]">
          <p className="text-xs text-[#8b949e] text-center leading-relaxed">
            🔒 토큰은 브라우저에 안전하게 저장되며,<br />GitHub API 호출에만 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

