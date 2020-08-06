/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useRef } from 'react';
import classNames from 'classnames';
import { useFocusOnTriggeringElementOnClose } from '../../lib/hooks';
import { Link, RouteComponentProps } from '@reach/router';

type UnitRowProps = {
  header: string;
  headerValue: string | null;
  noHeaderValueText?: string;
  noHeaderValueCtaText?: string;
  children?: React.ReactNode;
  headerValueClassName?: string;
  route?: string;
  queryParams?: string | null;
  revealModal?: () => void;
  modalRevealed?: boolean;
};

// TO DO: accept a refresh button prop to use in for secondary email
// and recovery key, a delete icon next to secondary email, and
// conditionally display "disable" for two-step auth

export const UnitRow = ({
  header,
  headerValue,
  route,
  queryParams,
  children,
  headerValueClassName,
  noHeaderValueText = 'None',
  noHeaderValueCtaText = 'Add',
  revealModal,
  modalRevealed,
}: UnitRowProps & RouteComponentProps) => {
  const ctaText = headerValue ? 'Change' : noHeaderValueCtaText;
  const modalTriggerElement = useRef<HTMLButtonElement>(null);
  useFocusOnTriggeringElementOnClose(modalRevealed, modalTriggerElement);

  return (
    <div className="unit-row">
      <div className="unit-row-header">
        <h3 data-testid="unit-row-header">{header}</h3>
      </div>
      <div className="unit-row-content">
        <p
          className={classNames('font-bold', headerValueClassName)}
          data-testid="unit-row-header-value"
        >
          {headerValue || noHeaderValueText}
        </p>
        {children}
      </div>

      <div className="unit-row-actions">
        <div>
          {route && (
            <Link
              className="cta-neutral transition-standard"
              data-testid="unit-row-route"
              to={route + queryParams}
            >
              {ctaText}
            </Link>
          )}

          {revealModal && (
            <button
              className="cta-neutral transition-standard"
              data-testid="unit-row-modal"
              ref={modalTriggerElement}
              onClick={revealModal}
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitRow;
