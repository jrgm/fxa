import { gql } from '@apollo/client';

export const GET_INITIAL_STATE = gql`
  query GetInitialState {
    account {
      uid
      displayName
      avatarUrl
      accountCreated
      passwordCreated
      recoveryKey
      emails {
        email
        isPrimary
        verified
      }
      attachedClients {
        clientId
        isCurrentSession
        userAgent
        deviceType
        deviceId
      }
      totp {
        exists
        verified
      }
      subscriptions {
        created
        productName
      }
    }
    session {
      verified
    }
  }
`;

export const GET_SESSION_VERIFIED = gql`
  query GetSession {
    session {
      verified
    }
  }
`;
