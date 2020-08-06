/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render, act } from '@testing-library/react';
import { MockedProvider, MockLink } from '@apollo/client/testing';
import '@testing-library/jest-dom/extend-expect';
import App from '.';
import * as Metrics from '../../lib/metrics';

// workaround for https://github.com/apollographql/apollo-client/issues/6559
const mockLink = new MockLink([], false);
mockLink.setOnError((error) => {
  return;
});

const appProps = {
  queryParams: {},
};

beforeEach(() => {
  window.location.replace = jest.fn();
});

it('renders', async () => {
  await act(async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false} link={mockLink}>
        <App {...appProps} />
      </MockedProvider>
    );
  });
});

it('redirects to /get_flow when flow data is not present', async () => {
  await act(async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false} link={mockLink}>
        <App {...appProps} />
      </MockedProvider>
    );
  });

  expect(window.location.replace).toHaveBeenCalledWith(
    `${window.location.origin}/get_flow?redirect_to=${encodeURIComponent(
      window.location.pathname
    )}`
  );
});

it('redirects to /get_flow when flow data is not present', async () => {
  const DEVICE_ID = 'yoyo';
  const BEGIN_TIME = 123456;
  const FLOW_ID = 'abc123';
  const flowInit = jest.spyOn(Metrics, 'init');
  const updatedAppProps = Object.assign(appProps, {
    queryParams: {
      device_id: DEVICE_ID,
      flow_begin_time: BEGIN_TIME,
      flow_id: FLOW_ID,
    },
  });

  await act(async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false} link={mockLink}>
        <App {...updatedAppProps} />
      </MockedProvider>
    );
  });

  expect(flowInit).toHaveBeenCalledWith({
    deviceId: DEVICE_ID,
    flowId: FLOW_ID,
    flowBeginTime: BEGIN_TIME,
  });
  expect(window.location.replace).not.toHaveBeenCalled();
});
