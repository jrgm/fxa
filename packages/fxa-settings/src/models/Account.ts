export interface Account {
  uid: string;
  displayName: string | null;
  avatarUrl: string | null;
  accountCreated: number;
  passwordCreated: number;
  recoveryKey: boolean;
  emails: {
    email: string;
    isPrimary: boolean;
    verified: boolean;
  }[];
  attachedClients: {
    clientId: string;
    isCurrentSession: boolean;
    userAgent: string;
    deviceType: string;
    deviceId: string;
  }[];
  totp: {
    exists: boolean;
    verified: boolean;
  };
  subscriptions: {
    created: number;
    productName: string;
  }[];
}
