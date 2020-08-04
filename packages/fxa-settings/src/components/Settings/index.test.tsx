/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import Settings from './index';
import { MOCK_ACCOUNT } from '../AccountDataHOC/mocks';
import {
  createHistory,
  createMemorySource,
  LocationProvider,
} from '@reach/router';

function renderWithRouter(
  ui: any,
  { route = '/', history = createHistory(createMemorySource(route)) } = {}
) {
  return {
    ...render(<LocationProvider history={history}>{ui}</LocationProvider>),
    history,
  };
}

it('renders without imploding', async () => {
  renderWithRouter(<Settings account={MOCK_ACCOUNT} />);
  expect(screen.getByTestId('settings-profile')).toBeInTheDocument();
});
