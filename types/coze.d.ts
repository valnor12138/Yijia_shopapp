/**
 * Coze Web SDK 类型定义
 */

interface CozeWebSDKConfig {
  bot_id: string;
}

interface CozeComponentProps {
  title?: string;
  [key: string]: any;
}

interface CozeAuthConfig {
  type: 'token';
  token: string;
  onRefreshToken?: () => string;
}

interface CozeWebChatClientOptions {
  config: CozeWebSDKConfig;
  componentProps?: CozeComponentProps;
  auth: CozeAuthConfig;
}

interface CozeWebChatClient {
  open?: () => void;
  show?: () => void;
  destroy?: () => void;
  [key: string]: any;
}

interface CozeWebSDK {
  WebChatClient: new (options: CozeWebChatClientOptions) => CozeWebChatClient;
}

declare global {
  interface Window {
    CozeWebSDK?: CozeWebSDK;
  }
}

export {};
