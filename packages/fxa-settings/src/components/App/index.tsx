/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { Suspense } from 'react';
import AccountDataHOC from '../AccountDataHOC';
import { AccountData } from '../AccountDataHOC/gql';
import AppLayout from '../AppLayout';
import Settings from '../Settings';
import AppErrorBoundary from 'fxa-react/components/AppErrorBoundary';
import { QueryParams } from '../../lib/types';
import FlowEvents from '../../lib/flow-event';
import { Router } from '@reach/router';
import FlowContainer from '../FlowContainer';
type AppProps = {
  queryParams: QueryParams;
};

export const App = ({ queryParams }: AppProps) => {
  FlowEvents.init(queryParams);
  return (
    <AppErrorBoundary>
      <AccountDataHOC>
        {({ account }: { account: AccountData }) => (
          <AppLayout
            avatarUrl={account.avatarUrl}
            primaryEmail={
              account.emails.find((email) => email.isPrimary)!.email
            }
            hasSubscription={Boolean(account.subscriptions.length)}
          >
            <Suspense fallback="">
              <Router basepath="/beta/settings">
                <Settings path="/" {...{ account }} />
                <FlowContainer path="/avatar/change" title="Profile picture" />
                <FlowContainer path="/display_name" title="Display name" />
                <FlowContainer
                  path="/change_password"
                  title="Change password"
                />
              </Router>
            </Suspense>
          </AppLayout>
        )}
      </AccountDataHOC>
    </AppErrorBoundary>
  );
};

export default App;
