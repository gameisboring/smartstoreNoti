# 소개

네이버 API 에서 조회된 변경구매내역을 활용하여 웹브라우저 기반 그래픽 오버레이 를 생성합니다

# 사용법

1. 압축 파일 압축 해제
2. "스마트 스토어 구매알리미 1.0.exe" 파일 실행
3. Windows 방화벽 관련 알림 - 엑세스 허용
4. 클라이언트 - 기타기능 상단에 표시된 주소를 송출프로그램에 브라우저 소스로 등록시킵니다. (가로 1920px 세로 1080px)

# 주의 사항

- 프로그램 설정은 본방송 시작전에 설정하시고, 충분한 구매테스트 후에 사용하시길 권장합니다.
  API 설정에 입력된 옵션 정보가 정확하지 않으면, 수집에 오류가 생깁니다.

# 주문정보 수집 방식

1. 프로그램이 작동하게되면 네이버 커머스API를 통해 특정 시간간격 내의 "변경 상품 주문 내역" 을 가져옵니다.
2. "변경 상품 주문 내역" 내의 상품주문번호를 사용 하여 주문 별 "상품주문 상세내역" 을 조회합니다.
3. "상품주문 상세내역"을 순회하며 "발주확인"된 상세내역을 필터링 합니다.
4. "필터링 된 상세내역"과 "주문리스트" 파일을 대조하여 "새로운 주문"인지 판별합니다.
5. 새로운 주문의 데이터를 "주문 리스트" 파일과 "순위표 리스트" 파일에 저장합니다.

### 주의사항

- 주문변경내역의 "요청범위시간은 10초 전부터 현재시각 까지"로 설정되어있습니다.
- 주문변경내역의 최대응답개수는 "300"개 입니다.
- 따라서 요청범위시간 내에 300개 이상의 데이터가 조회될 경우 초과한 데이터는 제공되지 않습니다.

# 리스트 파일

## 타입

### 배열로 감싸진 JSON 형식 문서입니다

## 경로

Windows에서의 경로는 C:\Users\\[사용자명]\AppData\Roaming\smartstorenoti\list

- 클라이언트 - 기타기능 - 저장소 - 리스트 폴더 버튼 클릭

## 주문리스트

\[해당날짜]\_list.json 으로 저장되어 있습니다

- 클라이언트 - 기타기능 - 알림 컨트롤러 - 주문리스트 버튼 클릭

- 이 프로그램은 리스트 파일에 저장되어있는 주문 리스트에 대하여
  이미 방송된 주문내역으로 처리합니다

### - 주문리스트 조작

- 방송으로 송출이 되지 않았거나 재송출을 원하는 경우에는
  주문리스트에서 해당 주문번호가 포함된 Object 를 삭제하시면
  새로운 주문건으로 처리됩니다

## 포인트 리스트

\[해당날짜]\_pointList.json 으로 저장되어 있습니다

- 클라이언트 - 기타기능 - 알림 컨트롤러 - 포인트 리스트 버튼 클릭

- 이 프로그램은 개별 주문 건에 대한 옵션값을 저장하여
  종합 환산하는 방식으로 점수를 계산합니다

### - 포인트 리스트 조작

- 원하는 주문내역을 Object 형태로 추가하시면 해당 주문건에 대한 내용이 순위표에 반영됩니다.

### ※ 리스트파일에 부여되는 날짜는 현재시각 기준 6시간 전 입니다

# 로그 파일

## 경로

Windows에서의 경로는 C:\Users\\[사용자명]\AppData\Roaming\smartstorenoti\logs\[해당날짜\].log

- 클라이언트 - 기타기능 - 저장소 - 로그 폴더 버튼 클릭

# 결과 파일

## 타입

### JSON 형식 문서입니다

## 판매수량

### 주문리스트에 집계된 데이터를 사용자가 확인 할 수 있는 파일로 출력합니다.

- 클라이언트 - 기타기능 - 결과확인 - 판매수량 확인

## 집계결과

### 점수판 레이아웃으로 활용되는 데이터를 파일로 출력합니다.

- 클라이언트 - 기타기능 - 결과확인 - 집계결과 확인

# 주문알림

### 주문알림 이미지 교체

- 클라이언트 - 방송설정 - 알림 이미지 설정

### 주문알림 멈춤 & 재개

- 클라이언트 - 기타기능 - 알림 컨트롤러 - 알림 일시정지 & 알림 시작 토글버튼 활용
