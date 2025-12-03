# Personal Access Token 설정 가이드

## ⚠️ 중요: Classic Token 사용 권장

이 앱은 **Classic Personal Access Token**을 기준으로 설계되었습니다.
Fine-grained token을 사용하면 레포지토리 삭제 기능이 작동하지 않을 수 있습니다.

## 레포지토리 삭제를 위한 토큰 권한

레포지토리 삭제 기능을 사용하려면 **`repo` 스코프의 전체 권한**이 필요합니다.
**Classic Token**을 사용하는 것을 강력히 권장합니다.

## 토큰 생성/확인 방법

### 1. 현재 토큰 확인
1. https://github.com/settings/tokens 접속
2. "GitHub Portfolio Uploader — repo" 토큰 확인
3. 토큰 이름(파란색 링크) 클릭하여 세부 권한 확인

### 2. 토큰 재생성 (권장)

⚠️ **중요**: Fine-grained token이 아닌 **Classic Token**을 사용하세요!

#### 단계별 가이드:

1. **Classic Token 생성 페이지 접속**
   - https://github.com/settings/tokens/new 접속
   - 또는 현재 페이지에서 왼쪽 메뉴 **"Tokens (classic)"** 클릭
   - "Generate new token" → **"Generate new token (classic)"** 클릭
   
   ⚠️ **주의**: "Fine-grained tokens"가 아닌 **"Tokens (classic)"**을 선택하세요!

2. **토큰 정보 입력**
   - **Note**: `GitHub Portfolio Uploader` (또는 원하는 이름)
   - **Expiration**: 원하는 만료 기간 선택
     - 30 days (30일)
     - 60 days (60일)
     - 90 days (90일)
     - Custom (사용자 지정)
     - No expiration (만료 없음) ⚠️ 보안상 권장하지 않음

3. **스코프 선택 (중요!)**
   - **`repo`** 체크박스를 찾아서 체크
   - ⚠️ **"repo"만 체크하면 하위 권한도 모두 포함됩니다**
   - 하위 권한에는 다음이 포함됩니다:
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite
     - ✅ **delete_repo** ← 이것이 필요합니다!

4. **토큰 생성**
   - "Generate token" 버튼 클릭
   - ⚠️ **토큰은 한 번만 표시됩니다!** 반드시 복사해서 안전한 곳에 저장

5. **앱에 적용**
   - 앱에서 로그아웃
   - 새 토큰으로 다시 로그인

## 권한 확인 체크리스트

✅ **필수 권한:**
- [ ] `repo` 스코프 체크됨
- [ ] 토큰이 만료되지 않음
- [ ] 토큰이 삭제되지 않음

✅ **테스트:**
- [ ] 앱에서 레포지토리 목록이 보임
- [ ] 본인이 소유한 레포지토리에 삭제 버튼이 보임
- [ ] 삭제 시도 시 권한 에러가 나지 않음

## 문제 해결

### 문제: "Must have admin rights" 에러
**원인**: 토큰에 `delete_repo` 권한이 없음
**해결**: 토큰 재생성 시 `repo` 전체 권한 선택

### 문제: 삭제 버튼이 보이지 않음
**원인**: 레포지토리 소유자가 아님
**해결**: 본인이 소유한 레포지토리만 삭제 가능 (정상 동작)

### 문제: 토큰이 만료됨
**원인**: 토큰 만료 기간이 지남
**해결**: 새 토큰 생성 후 다시 로그인

## 보안 주의사항

⚠️ **토큰은 비밀번호처럼 다루세요:**
- 다른 사람과 공유하지 마세요
- 공개 저장소에 올리지 마세요
- 만료 기간을 설정하세요
- 사용하지 않으면 삭제하세요

## 참고

- GitHub API 문서: https://docs.github.com/en/rest
- 토큰 관리: https://github.com/settings/tokens
- 레포지토리 삭제 API: https://docs.github.com/en/rest/repos/repos#delete-a-repository

