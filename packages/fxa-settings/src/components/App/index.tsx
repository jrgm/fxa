/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { useQuery } from '@apollo/client';
import AppLayout from '../AppLayout';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import AppErrorDialog from 'fxa-react/components/AppErrorDialog';
import Settings from '../Settings';
import AppErrorBoundary from 'fxa-react/components/AppErrorBoundary';
import { QueryParams } from '../../lib/types';
import FlowEvents from '../../lib/flow-event';
import { GET_INITIAL_STATE } from '../../operations/queries';
import { Account } from '../../models/Account';

type AppProps = {
  queryParams: QueryParams;
};

export const App = ({ queryParams }: AppProps) => {
  const { loading, error, data } = useQuery<{account: Account}>(GET_INITIAL_STATE);
  FlowEvents.init(queryParams);

  if (loading) {
    return (
      <LoadingSpinner className="bg-grey-20 flex items-center flex-col justify-center h-screen select-none" />
    );
  }

  if (error) {
    return <AppErrorDialog data-testid="error-dialog" {...{ error }} />;
  }

  const account = data!.account;

  return (
    <AppErrorBoundary>
      <AppLayout
        avatarUrl={account.avatarUrl}
        primaryEmail={account.emails.find((email) => email.isPrimary)!.email}
        hasSubscription={Boolean(account.subscriptions.length)}
      >
        <Settings {...{ account }} />
      </AppLayout>
    </AppErrorBoundary>
  );
};

export default App;
