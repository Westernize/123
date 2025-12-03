import React, { useState } from 'react';
import { FileUpload } from '../types/github';
import { FileText, Code, Globe, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  files: FileUpload[];
}

const templates: Template[] = [
  {
    id: 'portfolio',
    name: '포트폴리오',
    description: '기본 포트폴리오 웹사이트 템플릿',
    icon: <Globe className="w-5 h-5" />,
    files: [
      {
        name: 'index.html',
        path: 'index.html',
        content: btoa(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>포트폴리오</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>포트폴리오</h1>
  </header>
  <main>
    <section id="about">
      <h2>소개</h2>
      <p>자기소개를 작성하세요.</p>
    </section>
    <section id="projects">
      <h2>프로젝트</h2>
      <p>프로젝트를 소개하세요.</p>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>`),
      },
      {
        name: 'style.css',
        path: 'style.css',
        content: btoa(`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.6;
  color: #333;
}

header {
  background: #1f6feb;
  color: white;
  padding: 2rem;
  text-align: center;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

section {
  margin-bottom: 3rem;
}

h2 {
  margin-bottom: 1rem;
  color: #1f6feb;
}`),
      },
      {
        name: 'script.js',
        path: 'script.js',
        content: btoa(`// 포트폴리오 스크립트
console.log('포트폴리오가 로드되었습니다.');`),
      },
      {
        name: 'README.md',
        path: 'README.md',
        content: btoa(`# 포트폴리오

포트폴리오 웹사이트입니다.

## 시작하기

index.html 파일을 브라우저에서 열어보세요.`),
      },
    ],
  },
  {
    id: 'readme',
    name: 'README 템플릿',
    description: '프로젝트용 README.md 템플릿',
    icon: <FileText className="w-5 h-5" />,
    files: [
      {
        name: 'README.md',
        path: 'README.md',
        content: btoa(`# 프로젝트 이름

프로젝트에 대한 간단한 설명을 작성하세요.

## 기능

- 기능 1
- 기능 2
- 기능 3

## 설치 방법

\`\`\`bash
npm install
\`\`\`

## 사용 방법

\`\`\`bash
npm start
\`\`\`

## 라이선스

MIT`),
      },
    ],
  },
  {
    id: 'react',
    name: 'React 프로젝트',
    description: '기본 React 프로젝트 구조',
    icon: <Code className="w-5 h-5" />,
    files: [
      {
        name: 'package.json',
        path: 'package.json',
        content: btoa(`{
  "name": "my-react-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}`),
      },
      {
        name: 'src/App.js',
        path: 'src/App.js',
        content: btoa(`import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello React!</h1>
    </div>
  );
}

export default App;`),
      },
      {
        name: 'README.md',
        path: 'README.md',
        content: btoa(`# React 프로젝트

React로 만든 프로젝트입니다.

## 시작하기

\`\`\`bash
npm install
npm start
\`\`\``),
      },
    ],
  },
];

interface TemplateSelectorProps {
  onSelect: (files: FileUpload[]) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (template: Template) => {
    setSelected(template.id);
    onSelect(template.files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#58a6ff]" />
        <h3 className="text-sm font-semibold text-[#c9d1d9]">템플릿 선택</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template)}
            className={`p-4 border rounded-lg text-left transition-all ${
              selected === template.id
                ? 'border-[#1f6feb] bg-[#1c2128]'
                : 'border-[#30363d] hover:border-[#1f6feb] bg-[#161b22]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-[#58a6ff]">
              {template.icon}
              <span className="font-semibold text-[#c9d1d9]">{template.name}</span>
            </div>
            <p className="text-xs text-[#8b949e]">{template.description}</p>
            <p className="text-xs text-[#6e7681] mt-2">
              {template.files.length}개 파일
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;

