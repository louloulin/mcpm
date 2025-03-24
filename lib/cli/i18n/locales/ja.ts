import { Messages } from '../index';

// 日语翻译框架，可由专业翻译完善
const messages: Messages = {
  common: {
    error: 'エラー',
    warning: '警告',
    info: '情報',
    success: '成功',
    confirm: '確認',
    cancel: 'キャンセル',
    yes: 'はい',
    no: 'いいえ',
    loading: '読み込み中...',
    notFound: '見つかりません',
    invalidInput: '無効な入力',
    retry: '再試行',
    exit: '終了',
    help: 'ヘルプ',
    version: 'バージョン'
  },
  cli: {
    welcome: 'MCPM CLIへようこそ',
    goodbye: 'MCPM CLIをご利用いただきありがとうございます',
    helpText: '使用情報を表示するには --help を使用してください',
    exampleHeader: '例',
    documentationHeader: 'ドキュメント'
  },
  commands: {
    scaffold: {
      creating: '新しいMCPサーバープロジェクトを作成しています',
      created: 'MCPサーバープロジェクトが正常に作成されました',
      error: 'MCPサーバープロジェクトの作成中にエラーが発生しました',
      templateNotFound: 'テンプレートが見つかりません',
      confirmOverwrite: 'ディレクトリが既に存在します。上書きしますか？',
      scaffoldOptions: 'スキャフォールドオプション'
    },
    deploy: {
      deploying: 'MCPサーバーをデプロイしています',
      deployed: 'MCPサーバーが正常にデプロイされました',
      error: 'MCPサーバーのデプロイ中にエラーが発生しました',
      confirmDeploy: '{0}環境にデプロイしますか？',
      deployOptions: 'デプロイオプション',
      preparingDeploy: 'デプロイの準備中',
      checkingEnv: '環境変数を確認中',
      uploadingFiles: 'ファイルをアップロード中',
      configuringServer: 'サーバーを構成中',
      startingServer: 'サーバーを起動中'
    },
    status: {
      checking: 'MCPサーバーのステータスを確認しています',
      online: 'MCPサーバーはオンラインです',
      offline: 'MCPサーバーはオフラインです',
      error: 'サーバーステータスの確認中にエラーが発生しました',
      statusOptions: 'ステータスオプション',
      checkingConnection: '接続を確認中',
      resourceStatus: 'リソースステータス',
      healthStatus: 'ヘルスステータス'
    },
    logs: {
      fetching: 'MCPサーバーのログを取得しています',
      error: 'ログの取得中にエラーが発生しました',
      noLogs: 'ログが見つかりません',
      logsOptions: 'ログオプション',
      filtering: 'ログをフィルタリング中',
      streamingLogs: 'ログをストリーミング中'
    },
    update: {
      checking: '更新を確認しています',
      updating: 'MCPサーバーを更新しています',
      updated: 'MCPサーバーが正常に更新されました',
      noUpdates: '利用可能な更新はありません',
      error: 'MCPサーバーの更新中にエラーが発生しました',
      confirmUpdate: 'MCPサーバーをバージョン{0}に更新しますか？',
      updateOptions: '更新オプション',
      preparingUpdate: '更新の準備中',
      backingUp: 'バックアップを作成中',
      downloadingUpdate: '更新をダウンロード中',
      applyingUpdate: '更新を適用中',
      testingUpdate: '更新をテスト中',
      rollingBack: '更新をロールバック中'
    },
    backup: {
      creating: 'MCPサーバーのバックアップを作成しています',
      created: 'MCPサーバーのバックアップが正常に作成されました',
      error: 'バックアップの作成中にエラーが発生しました',
      confirmBackup: '{0}環境のバックアップを作成しますか？',
      backupOptions: 'バックアップオプション',
      preparingBackup: 'バックアップの準備中',
      savingDatabase: 'データベースを保存中',
      savingFiles: 'ファイルを保存中',
      compressing: 'バックアップを圧縮中',
      uploading: 'バックアップをアップロード中',
      cleaningUp: 'クリーンアップ中'
    },
    restore: {
      restoring: 'バックアップからMCPサーバーを復元しています',
      restored: 'MCPサーバーが正常に復元されました',
      error: 'バックアップからの復元中にエラーが発生しました',
      confirmRestore: 'バックアップ{0}から復元しますか？',
      restoreOptions: '復元オプション',
      preparingRestore: '復元の準備中',
      downloadingBackup: 'バックアップをダウンロード中',
      extractingBackup: 'バックアップを展開中',
      restoringDatabase: 'データベースを復元中',
      restoringFiles: 'ファイルを復元中',
      finishingRestore: '復元を完了中'
    },
    language: {
      description: 'CLI言語設定を変更する',
      listOption: '利用可能な言語を一覧表示',
      setOption: 'CLI言語を設定する (en, zh-CN, zh-TW, ja, ko)',
      currentOption: '現在の言語設定を表示',
      availableLanguages: '利用可能な言語:',
      current: '現在',
      currentLanguage: '現在の言語:',
      languageChanged: '言語が変更されました: {0}',
      restartRequired: '変更はCLIを再起動後に有効になります',
      setError: '言語の設定に失敗しました: {0}',
      availableOptions: '利用可能な言語オプション:',
      commandTitle: '言語コマンド:',
      operationError: '言語操作に失敗しました: {0}'
    }
  },
  errors: {
    missingRequiredOption: '必須オプションがありません: {0}',
    invalidOption: '無効なオプション: {0}',
    fileNotFound: 'ファイルが見つかりません: {0}',
    directoryNotFound: 'ディレクトリが見つかりません: {0}',
    permissionDenied: 'アクセス権限がありません: {0}',
    networkError: 'ネットワークエラー: {0}',
    timeoutError: 'タイムアウトエラー: {0}',
    unknownError: '不明なエラーが発生しました',
    environmentVariableMissing: '環境変数がありません: {0}',
    configError: '設定エラー: {0}',
    validationError: '検証エラー: {0}',
    cloudProviderError: 'クラウドプロバイダーエラー: {0}'
  },
  clouds: {
    aws: {
      name: 'Amazon Web Services',
      missingCredentials: 'AWS認証情報がありません',
      deployingLambda: 'Lambda関数をデプロイ中',
      deployingECS: 'ECSサービスをデプロイ中',
      configuringRDS: 'RDSデータベースを構成中',
      configuringS3: 'S3バケットを構成中',
      configuringRoute53: 'Route 53を構成中'
    },
    gcp: {
      name: 'Google Cloud Platform',
      missingCredentials: 'GCP認証情報がありません',
      deployingCloudRun: 'Cloud Runサービスをデプロイ中',
      deployingGKE: 'GKEにデプロイ中',
      configuringCloudSQL: 'Cloud SQLデータベースを構成中',
      configuringCloudStorage: 'Cloud Storageを構成中',
      configuringCloudDNS: 'Cloud DNSを構成中'
    },
    azure: {
      name: 'Microsoft Azure',
      missingCredentials: 'Azure認証情報がありません',
      deployingAppService: 'App Serviceをデプロイ中',
      deployingAKS: 'AKSにデプロイ中',
      configuringAzureSQL: 'Azure SQLデータベースを構成中',
      configuringBlobStorage: 'Blob Storageを構成中',
      configuringAzureDNS: 'Azure DNSを構成中'
    },
    alibaba: {
      name: 'Alibaba Cloud',
      missingCredentials: 'Alibaba Cloud認証情報がありません',
      deployingECS: 'ECSインスタンスをデプロイ中',
      deployingACK: 'ACKにデプロイ中',
      configuringRDS: 'ApsaraDB RDSを構成中',
      configuringOSS: 'OSSバケットを構成中',
      configuringDNS: 'Alibaba Cloud DNSを構成中'
    }
  }
};

export = messages; 