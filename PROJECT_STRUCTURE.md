# 프로젝트 구조 및 파일 설명

## 📦 npm start vs npm run dev

### 차이점

| 명령어 | 의미 | 사용 시점 |
|--------|------|-----------|
| **`npm start`** | 일반적인 관례 (표준 명령어) | Create React App 등에서 사용 |
| **`npm run dev`** | 커스텀 스크립트 (package.json에 정의된 것) | Vite, Next.js 등에서 사용 |

### 현재 프로젝트에서는?

현재 프로젝트는 **Vite**를 사용하므로:
- ✅ **`npm run dev`** 사용 (개발 서버 실행)
- ❌ `npm start`는 정의되어 있지 않음

### package.json의 scripts 확인

```json
"scripts": {
  "dev": "vite",              // 개발 서버 실행
  "build": "tsc && vite build", // 프로덕션 빌드
  "preview": "vite preview",   // 빌드된 파일 미리보기
  "lint": "eslint ..."         // 코드 검사
}
```

**결론**: 이 프로젝트에서는 `npm run dev`를 사용합니다!

---

## 📁 프로젝트 파일 구조 및 역할

### 🎯 실행 파일 (가장 중요!)

#### 1. **`src/main.tsx`** ⭐⭐⭐
**역할**: 앱의 진입점 (Entry Point)
- React 앱을 브라우저에 렌더링하는 시작점
- `index.html`의 `<div id="root">`에 앱을 마운트
- **없으면 앱이 실행되지 않음!**

```typescript
// src/main.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
```

#### 2. **`index.html`** ⭐⭐⭐
**역할**: HTML 템플릿
- 브라우저가 처음 로드하는 파일
- `<div id="root">`가 있어야 React 앱이 마운트됨
- `main.tsx`를 스크립트로 불러옴
- **없으면 앱이 실행되지 않음!**

```html
<!-- index.html -->
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

#### 3. **`src/App.tsx`** ⭐⭐⭐
**역할**: 메인 앱 컴포넌트
- 전체 앱의 구조를 정의
- 라우팅 설정 (로그인/대시보드)
- **앱의 핵심 로직**

---

### 🔧 설정 파일 (프로젝트 설정)

#### 4. **`package.json`** ⭐⭐⭐
**역할**: 프로젝트 설정 및 의존성 관리
- 설치된 패키지 목록
- 실행 스크립트 정의 (`npm run dev` 등)
- **프로젝트의 핵심 설정 파일**

#### 5. **`vite.config.ts`** ⭐⭐
**역할**: Vite 빌드 도구 설정
- 개발 서버 포트 설정 (3000)
- React 플러그인 설정
- 빌드 옵션 설정

#### 6. **`tsconfig.json`** ⭐⭐
**역할**: TypeScript 컴파일러 설정
- TypeScript 옵션 설정
- 타입 체크 규칙

#### 7. **`tailwind.config.js`** ⭐
**역할**: Tailwind CSS 설정
- 스타일링 옵션

#### 8. **`postcss.config.js`** ⭐
**역할**: PostCSS 설정
- Tailwind CSS 처리

---

### 📂 소스 코드 파일

#### 9. **`src/components/`** ⭐⭐⭐
**역할**: React 컴포넌트들
- `Login.tsx`: 로그인 화면
- `Dashboard.tsx`: 메인 대시보드
- `FileUploader.tsx`: 파일 업로드 컴포넌트
- `RepositorySelector.tsx`: 레포지토리 선택 컴포넌트

#### 10. **`src/contexts/AuthContext.tsx`** ⭐⭐
**역할**: 인증 상태 관리
- 로그인/로그아웃 상태
- 사용자 정보 관리
- GitHub API 클라이언트 관리

#### 11. **`src/utils/github.ts`** ⭐⭐
**역할**: GitHub API 관련 함수
- 레포지토리 조회/생성
- 파일 업로드
- 인증 관련 함수

#### 12. **`src/types/github.ts`** ⭐
**역할**: TypeScript 타입 정의
- Repository, FileUpload 등 타입 정의

#### 13. **`src/index.css`** ⭐
**역할**: 전역 CSS 스타일
- Tailwind CSS 임포트
- 기본 스타일 설정

---

### 📚 문서 파일

#### 14. **`README.md`** ⭐
**역할**: 프로젝트 설명서
- 설치 방법
- 사용 방법

#### 15. **`PROJECT_PROPOSAL.md`** ⭐
**역할**: 프로젝트 계획서
- 제출용 문서

#### 16. **`DEMO_GUIDE.md`** ⭐
**역할**: 시연 가이드
- 시연 시나리오

---

## 🚀 실행 흐름

```
1. 사용자가 브라우저에서 http://localhost:3000 접속
   ↓
2. index.html 로드
   ↓
3. <script src="/src/main.tsx"> 실행
   ↓
4. main.tsx에서 React 앱 시작
   ↓
5. App.tsx 렌더링
   ↓
6. 로그인 상태에 따라 Login.tsx 또는 Dashboard.tsx 표시
```

---

## 📋 파일 중요도 정리

### 필수 파일 (없으면 앱이 실행 안 됨)
1. ⭐⭐⭐ `src/main.tsx` - 진입점
2. ⭐⭐⭐ `index.html` - HTML 템플릿
3. ⭐⭐⭐ `src/App.tsx` - 메인 컴포넌트
4. ⭐⭐⭐ `package.json` - 프로젝트 설정

### 핵심 기능 파일
5. ⭐⭐ `src/components/` - 모든 컴포넌트
6. ⭐⭐ `src/contexts/AuthContext.tsx` - 인증 관리
7. ⭐⭐ `src/utils/github.ts` - GitHub API

### 설정 파일
8. ⭐⭐ `vite.config.ts` - 빌드 설정
9. ⭐⭐ `tsconfig.json` - TypeScript 설정
10. ⭐ `tailwind.config.js` - 스타일 설정

---

## 💡 요약

### 실행 명령어
- **개발**: `npm run dev` (Vite 사용)
- **빌드**: `npm run build` (배포용)
- **미리보기**: `npm run preview` (빌드된 파일 확인)

### 가장 중요한 파일
1. `src/main.tsx` - 앱 시작점
2. `index.html` - HTML 템플릿
3. `src/App.tsx` - 메인 로직
4. `package.json` - 프로젝트 설정

