# 소개

네이버 API 에서 조회된 변경구매내역을 활용하여 웹브라우저 기반 그래픽 오버레이 를 생성합니다

<br>

# 사용법

1. 설치파일 실행
2. 환경변수 설정

   1. 작업표시줄 검색 "시스템 환경변수 편집"
   2. 환경변수 버튼 클릭 -> 시스템변수 영역 -> 새로만들기 클릭
   3. 내용입력<br>
      변수 이름 : GOOGLE_APPLICATION_CREDENTIALS<br>
      변수 값 : C:\Users\user\AppData\Roaming\smartstorenoti\tts-api-account.json
   4. 동봉된 "tts-api-account.json" 파일을<br>
      "C:\Users\user\AppData\Roaming\smartstorenoti" 경로에 저장

<br>

# 리스트 파일

## 타입

배열로 감싸진 JSON 형식 문서입니다

## 경로

Windows에서의 경로는 C:\Users\\[사용자명]\AppData\Roaming\smartstorenoti\list

## 주문리스트

\[해당날짜]\_list.json 으로 저장되어 있습니다

- 이 프로그램은 리스트 파일에 저장되어있는 주문 리스트에 대하여<br>
  이미 방송된 주문내역으로 처리합니다

### - 주문리스트 조작

- 방송으로 송출이 되지 않았거나 재송출을 원하는 경우에는<br>
  주문리스트에서 해당 주문번호가 포함된 Object 를 삭제하시면<br>
  새로운 주문건으로 처리됩니다

## 순위표

\[해당날짜]\_pointList.json 으로 저장되어 있습니다

- 이 프로그램은 개별 주문 건에 대한 옵션값을 저장하여<br>
  종합 환산하는 방식으로 점수를 계산합니다

### - 순위표 조작

- 원하는 주문내역을 Object 형태로 추가하시면 해당 주문건에 대한 내용이 순위표에 반영됩니다.

<br>

# 기술 문의

프로그램 사용 및 운용 중 기술 문의 사항이 있을 경우 개발자에게 문의 바랍니다.
