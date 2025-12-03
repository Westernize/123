# 레포지토리 삭제 오류 원인 분석

## 🔍 문제 상황

- **토큰 타입**: Fine-grained personal access token 사용 중
- **에러 메시지**: "이 레포지토리를 삭제할 권한이 없습니다. 레포지토리 소유자만 삭제할 수 있습니다."
- **상황**: 토큰을 재생성했지만 여전히 삭제 실패

---

## 🎯 원인 분석

### 1. Fine-grained Token vs Classic Token 차이

#### Fine-grained Token (현재 사용 중)
- ✅ **장점**: 더 세밀한 권한 제어, 보안 강화
- ❌ **단점**: 레포지토리 삭제 권한 설정이 복잡함
- ⚠️ **문제**: "Repository administration" 권한이 별도로 필요할 수 있음

#### Classic Token (권장)
- ✅ **장점**: `repo` 스코프만 체크하면 모든 repo 권한 포함
- ✅ **장점**: 레포지토리 삭제 권한이 자동 포함
- ✅ **장점**: 설정이 간단함

### 2. Fine-grained Token에서 삭제 권한 문제

Fine-grained token에서 레포지토리 삭제를 위해서는:

1. **Repository permissions** 섹션에서:
   - ✅ **"Administration"** 권한이 필요
   - 또는
   - ✅ **"Metadata"** + **"Contents"** + **"Administration"** 권한

2. **Resource access** 설정:
   - ✅ 모든 레포지토리 또는 특정 레포지토리 선택
   - ✅ 본인이 소유한 레포지토리만 선택했는지 확인

### 3. 가능한 원인들

#### 원인 1: Fine-grained Token 권한 부족 ⭐ (가장 가능성 높음)
- Fine-grained token에 "Repository administration" 권한이 없음
- 또는 "Administration" 권한이 체크되지 않음

#### 원인 2: Resource Access 제한
- Fine-grained token이 특정 레포지토리만 접근하도록 설정됨
- 삭제하려는 레포지토리가 토큰의 접근 목록에 없음

#### 원인 3: 토큰 타입 불일치
- 앱이 Classic token을 기대하지만 Fine-grained token 사용 중
- Fine-grained token은 API 호출 방식이 약간 다를 수 있음

---

## ✅ 해결 방법

### 방법 1: Classic Token 사용 (가장 간단) ⭐ 권장

Fine-grained token 대신 **Classic token**을 사용하세요:

1. **Classic Token 생성**
   - https://github.com/settings/tokens/new 접속
   - 또는 현재 페이지에서 왼쪽 메뉴에서 **"Tokens (classic)"** 클릭
   - "Generate new token" → **"Generate new token (classic)"** 클릭

2. **토큰 설정**
   - **Note**: `GitHub Portfolio Uploader`
   - **Expiration**: 원하는 기간
   - **Select scopes**: ✅ **`repo`** 체크 (전체 repo 권한)
   - **Generate token** 클릭

3. **토큰 적용**
   - 앱에서 로그아웃
   - 새 Classic token으로 로그인
   - 삭제 테스트

### 방법 2: Fine-grained Token 권한 수정

Fine-grained token을 계속 사용하려면:

1. **토큰 편집**
   - 현재 Fine-grained token 이름 클릭 (예: "appDevelopment")
   - "Edit" 버튼 클릭

2. **Repository permissions 설정**
   - **"Administration"** 권한을 **"Read and write"** 또는 **"Read-only"**에서 변경
   - ⚠️ Fine-grained token에는 "Administration" 권한이 없을 수 있음
   - 이 경우 Classic token 사용 권장

3. **Resource access 확인**
   - "All repositories" 선택
   - 또는 삭제하려는 레포지토리가 포함되어 있는지 확인

4. **저장 후 테스트**

### 방법 3: 브라우저 콘솔 확인

디버깅을 위해 콘솔 로그 확인:

1. **F12** 키로 개발자 도구 열기
2. **Console** 탭 선택
3. 레포지토리 삭제 버튼 클릭
4. 다음 로그 확인:
   ```javascript
   삭제 시도: {
     repoOwner: "jinwooPark123",
     currentUser: "jinwooPark123",
     fullName: "jinwooPark123/app_project",
     ownerMatch: true/false
   }
   ```
5. 에러 상세 정보 확인:
   ```javascript
   레포지토리 삭제 실패 상세: {
     status: 403,
     message: "...",
     owner: "...",
     repo: "..."
   }
   ```

---

## 🔧 권장 해결책

### ⭐ Classic Token 사용 (가장 확실한 방법)

**이유:**
1. ✅ 레포지토리 삭제 권한이 자동 포함
2. ✅ 설정이 간단함
3. ✅ GitHub API와 완벽 호환
4. ✅ 이 앱은 Classic token을 기준으로 설계됨

**단계:**
1. Fine-grained token 삭제 (선택사항)
2. Classic token 생성 (`repo` 스코프)
3. 앱에서 새 토큰으로 로그인
4. 삭제 테스트

---

## 📋 체크리스트

### Fine-grained Token 사용 시
- [ ] "Repository administration" 권한이 있는지 확인
- [ ] Resource access에서 모든 레포지토리 또는 해당 레포지토리 선택
- [ ] 토큰이 만료되지 않았는지 확인
- [ ] 본인이 레포지토리 소유자인지 확인

### Classic Token 사용 시 (권장)
- [ ] `repo` 스코프 체크됨
- [ ] 토큰이 만료되지 않음
- [ ] 앱에서 새 토큰으로 로그인 완료

---

## 🐛 추가 디버깅

### 브라우저 콘솔에서 확인할 정보

```javascript
// 1. 삭제 시도 시
삭제 시도: {
  repoOwner: "사용자명",
  currentUser: "사용자명",
  ownerMatch: true/false
}

// 2. API 호출 시
삭제 API 호출: {
  owner: "사용자명",
  repo: "레포지토리명"
}

// 3. 에러 발생 시
레포지토리 삭제 실패 상세: {
  status: 403,  // 또는 다른 상태 코드
  message: "에러 메시지",
  owner: "사용자명",
  repo: "레포지토리명"
}
```

### GitHub API 직접 테스트

토큰 권한을 직접 확인하려면:

```bash
# curl 명령어로 테스트 (터미널에서)
curl -H "Authorization: token YOUR_TOKEN" \
     -X DELETE \
     https://api.github.com/repos/USERNAME/REPO_NAME
```

---

## 💡 결론

**가장 확실한 해결책: Classic Token 사용**

Fine-grained token은 보안이 강화되었지만, 레포지토리 삭제 같은 관리 작업에는 Classic token이 더 적합합니다. 

**즉시 해결 방법:**
1. Classic token 생성 (`repo` 스코프)
2. 앱에서 새 토큰으로 로그인
3. 삭제 기능 테스트

이 방법으로 99% 해결됩니다! 🎯

