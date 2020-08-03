/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import AccountDataHOC from '../AccountDataHOC';
import { AccountData } from '../AccountDataHOC/gql';
import AppLayout from '../AppLayout';
import Settings from '../Settings';
import AppErrorBoundary from 'fxa-react/components/AppErrorBoundary';
import { QueryParams } from '../../lib/types';
import * as Metrics from '../../lib/metrics';

type AppProps = {
  queryParams: QueryParams;
};

export const App = ({ queryParams }: AppProps) => {
  Metrics.init({
    deviceId: queryParams.device_id,
    flowBeginTime: queryParams.flow_begin_time,
    flowId: queryParams.flow_id,
  });

  return (
    <AppErrorBoundary>
      <AccountDataHOC>
        {({ account }: { account: AccountData }) => {
          Metrics.setProperties({
            lang: document.querySelector('html')?.getAttribute('lang'),
            uid: account.uid,
            // uniqueUserId is only used in Metrics for now, but looks like
            // it is more widely used in content-server, so this may warrant
            // abstraction into its own library. Please see:
            // packages/fxa-content-server/app/scripts/models/unique-user-id.js
            uniqueUserId: uuidv4(),
          });

          return (
            <AppLayout
              avatarUrl={account.avatarUrl}
              primaryEmail={
                account.emails.find((email) => email.isPrimary)!.email
              }
              hasSubscription={Boolean(account.subscriptions.length)}
            >
              <Settings {...{ account }} />
            </AppLayout>
          );
        }}
      </AccountDataHOC>
    </AppErrorBoundary>
  );
};

export default App;
