# GitHub 포트폴리오 자동 업로드 앱

초급 개발자와 GitHub 사용이 어려운 사용자를 위한 간편한 GitHub 포트폴리오 관리 앱입니다.

## 📋 프로젝트 개요

명령어 없이도 GitHub에 파일을 업로드할 수 있는 웹 기반 애플리케이션입니다. 드래그 앤 드롭으로 간단하게 파일을 업로드하고, 자동으로 GitHub에 커밋됩니다.

### 개발 배경
- Git 명령어의 복잡성으로 인한 진입 장벽
- 컴퓨터가 없는 상황에서의 접근성 문제
- 반복적인 명령어 입력의 번거로움

### 타겟 사용자
- 학부생
- 초급 개발자
- GitHub 사용의 진입 장벽에 부딪힌 사람
- GitHub를 편리하게 사용하고 싶은 사람

## ✨ 주요 기능

- ✅ **GitHub 인증**: Personal Access Token 기반 로그인
- ✅ **레포지토리 관리**: 목록 조회 및 새 레포지토리 생성
- ✅ **파일 업로드**: 드래그 앤 드롭 또는 파일 선택
- ✅ **자동 커밋**: 업로드한 파일 자동으로 GitHub에 커밋
- ✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- ✅ **실시간 피드백**: 업로드 상태 및 결과 즉시 표시

## 🛠 기술 스택

- **React 18** + **TypeScript**: 사용자 인터페이스
- **Vite**: 빠른 개발 서버 및 빌드
- **Tailwind CSS**: 스타일링 및 반응형 디자인
- **GitHub REST API**: 레포지토리 및 파일 관리
- **@octokit/rest**: GitHub API 클라이언트

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. GitHub Personal Access Token 생성

1. [GitHub Settings > Tokens](https://github.com/settings/tokens/new) 접속
2. **Note**: "GitHub Portfolio Uploader" 입력
3. **Expiration**: 원하는 기간 선택
4. **Scopes**: `repo` 체크 (전체 권한)
5. **Generate token** 클릭 후 토큰 복사

> ⚠️ **주의**: 토큰을 안전하게 보관하세요. 다른 사람과 공유하지 마세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`이 자동으로 열립니다.

### 4. 사용 방법

1. **로그인**: 생성한 Personal Access Token 입력
2. **레포지토리 선택**: 기존 레포지토리 선택 또는 새로 생성
3. **파일 업로드**: 파일을 드래그 앤 드롭하거나 선택
4. **완료**: 자동으로 GitHub에 커밋됩니다!

## 📁 프로젝트 구조

```
appDevelopment/
├── src/
│   ├── components/       # React 컴포넌트
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FileUploader.tsx
│   │   └── RepositorySelector.tsx
│   ├── contexts/         # Context API
│   │   └── AuthContext.tsx
│   ├── types/            # TypeScript 타입 정의
│   │   └── github.ts
│   ├── utils/            # 유틸리티 함수
│   │   └── github.ts
│   ├── App.tsx           # 메인 앱 컴포넌트
│   ├── main.tsx          # 진입점
│   └── index.css         # 전역 스타일
├── package.json
├── vite.config.ts
└── README.md
```

## 📚 문서

- [프로젝트 계획 제안서](./PROJECT_PROPOSAL.md) - 상세한 프로젝트 계획 및 명세
- [프로젝트 개요](./PROJECT_OVERVIEW.md) - 개발 계기 및 개요
- [시연 가이드](./DEMO_GUIDE.md) - 시연 시나리오 및 체크리스트

## 🔧 빌드

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## ⚠️ 제약사항

- **파일 크기**: GitHub API는 파일당 100MB까지 지원
- **API 제한**: 시간당 5,000 requests 제한
- **보안**: Personal Access Token은 브라우저에 저장됨 (프로덕션에서는 백엔드 권장)

## 🔮 향후 계획

- [ ] 폴더 구조 업로드
- [ ] 파일 편집 및 삭제
- [ ] OAuth 인증 (토큰 대신)
- [ ] 커밋 메시지 커스터마이징
- [ ] 파일 미리보기
- [ ] 업로드 히스토리

## 📄 라이선스

MIT

## 👥 기여

이슈 및 풀 리퀘스트 환영합니다!

---

**"GitHub를 더 쉽게, 더 편리하게"** 🚀
