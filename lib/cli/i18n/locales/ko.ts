import { Messages } from '../index';

// 韩语翻译框架，可由专业翻译完善
const messages: Messages = {
  common: {
    error: '오류',
    warning: '경고',
    info: '정보',
    success: '성공',
    confirm: '확인',
    cancel: '취소',
    yes: '예',
    no: '아니오',
    loading: '로딩 중...',
    notFound: '찾을 수 없음',
    invalidInput: '잘못된 입력',
    retry: '재시도',
    exit: '종료',
    help: '도움말',
    version: '버전'
  },
  cli: {
    welcome: 'MCPM CLI에 오신 것을 환영합니다',
    goodbye: 'MCPM CLI를 사용해 주셔서 감사합니다',
    helpText: '사용 정보를 보려면 --help를 사용하세요',
    exampleHeader: '예시',
    documentationHeader: '문서'
  },
  commands: {
    scaffold: {
      creating: '새 MCP 서버 프로젝트를 생성하는 중',
      created: 'MCP 서버 프로젝트가 성공적으로 생성되었습니다',
      error: 'MCP 서버 프로젝트 생성 중 오류가 발생했습니다',
      templateNotFound: '템플릿을 찾을 수 없습니다',
      confirmOverwrite: '디렉토리가 이미 존재합니다. 덮어쓰시겠습니까?',
      scaffoldOptions: '스캐폴드 옵션'
    },
    deploy: {
      deploying: 'MCP 서버를 배포하는 중',
      deployed: 'MCP 서버가 성공적으로 배포되었습니다',
      error: 'MCP 서버 배포 중 오류가 발생했습니다',
      confirmDeploy: '{0} 환경에 배포하시겠습니까?',
      deployOptions: '배포 옵션',
      preparingDeploy: '배포 준비 중',
      checkingEnv: '환경 변수 확인 중',
      uploadingFiles: '파일 업로드 중',
      configuringServer: '서버 구성 중',
      startingServer: '서버 시작 중'
    },
    status: {
      checking: 'MCP 서버 상태를 확인하는 중',
      online: 'MCP 서버가 온라인 상태입니다',
      offline: 'MCP 서버가 오프라인 상태입니다',
      error: '서버 상태 확인 중 오류가 발생했습니다',
      statusOptions: '상태 옵션',
      checkingConnection: '연결 확인 중',
      resourceStatus: '리소스 상태',
      healthStatus: '상태 점검'
    },
    logs: {
      fetching: 'MCP 서버 로그를 가져오는 중',
      error: '로그 가져오기 중 오류가 발생했습니다',
      noLogs: '로그를 찾을 수 없습니다',
      logsOptions: '로그 옵션',
      filtering: '로그 필터링 중',
      streamingLogs: '실시간 로그 스트리밍'
    },
    update: {
      checking: '업데이트 확인 중',
      updating: 'MCP 서버를 업데이트하는 중',
      updated: 'MCP 서버가 성공적으로 업데이트되었습니다',
      noUpdates: '사용 가능한 업데이트가 없습니다',
      error: 'MCP 서버 업데이트 중 오류가 발생했습니다',
      confirmUpdate: 'MCP 서버를 버전 {0}으로 업데이트하시겠습니까?',
      updateOptions: '업데이트 옵션',
      preparingUpdate: '업데이트 준비 중',
      backingUp: '백업 생성 중',
      downloadingUpdate: '업데이트 다운로드 중',
      applyingUpdate: '업데이트 적용 중',
      testingUpdate: '업데이트 테스트 중',
      rollingBack: '업데이트 롤백 중'
    },
    backup: {
      creating: 'MCP 서버 백업을 생성하는 중',
      created: 'MCP 서버 백업이 성공적으로 생성되었습니다',
      error: '백업 생성 중 오류가 발생했습니다',
      confirmBackup: '{0} 환경의 백업을 생성하시겠습니까?',
      backupOptions: '백업 옵션',
      preparingBackup: '백업 준비 중',
      savingDatabase: '데이터베이스 저장 중',
      savingFiles: '파일 저장 중',
      compressing: '백업 압축 중',
      uploading: '백업 업로드 중',
      cleaningUp: '정리 중'
    },
    restore: {
      restoring: '백업에서 MCP 서버를 복원하는 중',
      restored: 'MCP 서버가 성공적으로 복원되었습니다',
      error: '백업에서 복원 중 오류가 발생했습니다',
      confirmRestore: '백업 {0}에서 복원하시겠습니까?',
      restoreOptions: '복원 옵션',
      preparingRestore: '복원 준비 중',
      downloadingBackup: '백업 다운로드 중',
      extractingBackup: '백업 추출 중',
      restoringDatabase: '데이터베이스 복원 중',
      restoringFiles: '파일 복원 중',
      finishingRestore: '복원 완료 중'
    },
    language: {
      description: 'CLI 언어 설정 변경',
      listOption: '사용 가능한 언어 목록',
      setOption: 'CLI 언어 설정 (en, zh-CN, zh-TW, ja, ko)',
      currentOption: '현재 언어 설정 표시',
      availableLanguages: '사용 가능한 언어:',
      current: '현재',
      currentLanguage: '현재 언어:',
      languageChanged: '언어가 변경되었습니다: {0}',
      restartRequired: 'CLI를 재시작한 후 변경 사항이 적용됩니다',
      setError: '언어 설정 실패: {0}',
      availableOptions: '사용 가능한 언어 옵션:',
      commandTitle: '언어 명령:',
      operationError: '언어 작업 실패: {0}'
    }
  },
  errors: {
    missingRequiredOption: '필수 옵션이 누락되었습니다: {0}',
    invalidOption: '잘못된 옵션: {0}',
    fileNotFound: '파일을 찾을 수 없습니다: {0}',
    directoryNotFound: '디렉토리를 찾을 수 없습니다: {0}',
    permissionDenied: '권한이 거부되었습니다: {0}',
    networkError: '네트워크 오류: {0}',
    timeoutError: '시간 초과 오류: {0}',
    unknownError: '알 수 없는 오류가 발생했습니다',
    environmentVariableMissing: '환경 변수가 누락되었습니다: {0}',
    configError: '구성 오류: {0}',
    validationError: '유효성 검사 오류: {0}',
    cloudProviderError: '클라우드 제공업체 오류: {0}'
  },
  clouds: {
    aws: {
      name: 'Amazon Web Services',
      missingCredentials: 'AWS 자격 증명이 누락되었습니다',
      deployingLambda: 'Lambda 함수 배포 중',
      deployingECS: 'ECS 서비스 배포 중',
      configuringRDS: 'RDS 데이터베이스 구성 중',
      configuringS3: 'S3 버킷 구성 중',
      configuringRoute53: 'Route 53 구성 중'
    },
    gcp: {
      name: 'Google Cloud Platform',
      missingCredentials: 'GCP 자격 증명이 누락되었습니다',
      deployingCloudRun: 'Cloud Run 서비스 배포 중',
      deployingGKE: 'GKE 배포 중',
      configuringCloudSQL: 'Cloud SQL 데이터베이스 구성 중',
      configuringCloudStorage: 'Cloud Storage 구성 중',
      configuringCloudDNS: 'Cloud DNS 구성 중'
    },
    azure: {
      name: 'Microsoft Azure',
      missingCredentials: 'Azure 자격 증명이 누락되었습니다',
      deployingAppService: 'App Service 배포 중',
      deployingAKS: 'AKS 배포 중',
      configuringAzureSQL: 'Azure SQL 데이터베이스 구성 중',
      configuringBlobStorage: 'Blob Storage 구성 중',
      configuringAzureDNS: 'Azure DNS 구성 중'
    },
    alibaba: {
      name: 'Alibaba Cloud',
      missingCredentials: 'Alibaba Cloud 자격 증명이 누락되었습니다',
      deployingECS: 'ECS 인스턴스 배포 중',
      deployingACK: 'ACK 배포 중',
      configuringRDS: 'ApsaraDB RDS 구성 중',
      configuringOSS: 'OSS 버킷 구성 중',
      configuringDNS: 'Alibaba Cloud DNS 구성 중'
    }
  }
};

export = messages; 