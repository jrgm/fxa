/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AppLayout from '.';
import {
  createHistory,
  createMemorySource,
  LocationProvider,
} from '@reach/router';

function renderWithRouter(
  ui,
  { route = '/', history = createHistory(createMemorySource(route)) } = {}
) {
  return {
    ...render(<LocationProvider history={history}>{ui}</LocationProvider>),
    history,
  };
}

it('renders the app with children', async () => {
  const {
    container,
    history: { navigate },
    getByTestId,
  } = renderWithRouter(
    <AppLayout
      avatarUrl={null}
      primaryEmail="user@example.com"
      hasSubscription={false}
    >
      <p data-testid="test-child">Hello, world!</p>
    </AppLayout>
  );
  await navigate('/beta/settings');
  expect(getByTestId('app')).toBeInTheDocument();
  expect(getByTestId('content-skip')).toBeInTheDocument();
  expect(getByTestId('header')).toBeInTheDocument();
  expect(getByTestId('footer')).toBeInTheDocument();
  expect(getByTestId('nav')).toBeInTheDocument();
  expect(getByTestId('main')).toBeInTheDocument();
  expect(getByTestId('main')).toContainElement(getByTestId('test-child'));
});
