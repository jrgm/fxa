/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import sentryMetrics from 'fxa-shared/lib/sentry';
import { Hash } from './types';

const NOT_REPORTED_VALUE = 'none';
const UNKNOWN_VALUE = 'unknown';
const WEB_CONTEXT = 'web';

type Optional<T> = T | typeof NOT_REPORTED_VALUE;

type ScreenInfo = {
  clientHeight: Optional<number>;
  clientWidth: Optional<number>;
  devicePixelRatio: Optional<number>;
  height: Optional<number>;
  width: Optional<number>;
};

type EventSet = {
  offset: number;
  type: string;
};

type ExperimentGroup = {
  choice: string;
  group: string;
};

type MarketingCampaign = {
  campaignId: string;
  clicked: boolean;
  url: string;
};

type UserPreferences = {
  [userPref: string]: boolean;
};

type FlowEventData = {
  deviceId?: string;
  flowBeginTime?: number;
  flowId?: string;
};

type ConfigurableProperties = {
  broker: Optional<string>;
  context: string | typeof WEB_CONTEXT;
  experiments: ExperimentGroup[];
  isSampledUser: boolean;
  lang: string | typeof UNKNOWN_VALUE;
  marketing: MarketingCampaign[];
  newsletters: string[];
  service: Optional<string>;
  startTime: number;
  uid: Optional<string>;
  uniqueUserId: Optional<string>;
  userPreferences: UserPreferences;
  utm_campaign: Optional<string>;
  utm_content: Optional<string>;
  utm_medium: Optional<string>;
  utm_source: Optional<string>;
  utm_term: Optional<string>;
};

type EventData = FlowEventData &
  ConfigurableProperties & {
    duration: number;
    events: EventSet[];
    flushTime: number;
    referrer: string;
    screen: ScreenInfo;
    [additionalProperty: string]: any;
  };

let initialized = false;
let viewNamePrefix: string | null;
let flowEventData: FlowEventData;
let configurableProperties: ConfigurableProperties = defaultConfigProps();

function defaultConfigProps(): ConfigurableProperties {
  return {
    experiments: [],
    lang: UNKNOWN_VALUE,
    marketing: [],
    newsletters: [],
    // FIXME: performance.timing.navigationStart should work, but doesn't
    startTime: 123,
    uid: NOT_REPORTED_VALUE,
    userPreferences: {},
    utm_campaign: NOT_REPORTED_VALUE,
    utm_content: NOT_REPORTED_VALUE,
    utm_medium: NOT_REPORTED_VALUE,
    utm_source: NOT_REPORTED_VALUE,
    utm_term: NOT_REPORTED_VALUE,
    uniqueUserId: NOT_REPORTED_VALUE,

    // TODO: Properties below still need to be set, and will likely
    // need to come from the flow data request on the content server

    // All user metrics are sent to the backend. Data is only
    // reported to metrics if isSampledUser is true.
    // packages/fxa-content-server/app/scripts/lib/app-start.js:176
    isSampledUser: false,
    // packages/fxa-content-server/app/scripts/lib/app-start.js:327
    broker: NOT_REPORTED_VALUE,
    // packages/fxa-content-server/app/scripts/lib/app-start.js:189
    context: WEB_CONTEXT,
    // packages/fxa-content-server/app/scripts/lib/app-start.js:198
    service: NOT_REPORTED_VALUE,
  };
}

/**
 * Get user's window/screen info
 */
function getScreenInfo(): ScreenInfo {
  const documentElement = window.document.documentElement || {};
  const screen = window.screen || {};

  return {
    clientHeight: documentElement.clientHeight || NOT_REPORTED_VALUE,
    clientWidth: documentElement.clientWidth || NOT_REPORTED_VALUE,
    devicePixelRatio: window.devicePixelRatio || NOT_REPORTED_VALUE,
    height: screen.height || NOT_REPORTED_VALUE,
    width: screen.width || NOT_REPORTED_VALUE,
  };
}

/**
 * Send metrics data to the content-server metrics
 * endpoint via navigator.sendBeacon
 */
function postMetrics(eventData: EventData) {
  if (!initialized || !window.navigator.sendBeacon) {
    return;
  }

  window.navigator.sendBeacon('/metrics', JSON.stringify(eventData));
}

/**
 * Reset Metrics setup; used for testing
 */
export function reset() {
  initialized = false;
  viewNamePrefix = null;
  flowEventData = {};
  configurableProperties = defaultConfigProps();
}

/**
 * Initialize FxA flow metrics recording
 *
 * If all flow data is not present, will redirect back to the
 * content-server to retrieve a new set of flow data
 */
export function init(
  /** Flow data sent via query params from the content-server */
  _flowEventData: FlowEventData
) {
  if (!initialized) {
    if (
      _flowEventData.deviceId &&
      _flowEventData.flowBeginTime &&
      _flowEventData.flowId
    ) {
      flowEventData = _flowEventData;
      initialized = true;
    } else {
      let redirectPath = window.location.pathname;
      if (window.location.search) {
        redirectPath += window.location.search;
      }

      return window.location.replace(
        `${window.location.origin}/get_flow?redirect_to=${encodeURIComponent(
          redirectPath
        )}`
      );
    }
  }
}

/**
 * Set the value of multiple configurable metrics event properties
 */
export function setProperties(properties: Hash<any>) {
  // Feature, but also protection: guard against setting a property
  // with a null value; defaults set in defaultConfigProps should
  // remain the "unset" value of a configurable property
  Object.keys(properties).forEach(
    (key) => properties[key] == null && delete properties[key]
  );

  configurableProperties = Object.assign(configurableProperties, properties);
}

/**
 * Set the view name prefix for metrics that contain a viewName.
 * This is used to differentiate between flows when the same
 * URL can appear in more than one place in the flow, e.g., the
 * /sms screen. The /sms screen can be displayed in either the
 * signup or verification tab, and we want to be able to
 * differentiate between the two.
 *
 * This prefix is prepended to the view name anywhere a view
 * name is used.
 */
export function setViewNamePrefix(prefix: string) {
  viewNamePrefix = prefix;
}

/**
 * Initialize a payload of metric event data to the metrics endpoint
 */
export function logEvents(
  /** Events to log; converted to proper event groups */
  eventSlugs: string[] = [],
  /* Additional properties to log with the events */
  eventProperties: Hash<any> = {}
) {
  try {
    const now = Date.now();
    const eventOffset = now - flowEventData.flowBeginTime!;

    postMetrics(
      Object.assign(configurableProperties, {
        duration: 0, // TODO where is this set?
        events: eventSlugs.map((slug) => ({ type: slug, offset: eventOffset })),
        flushTime: now,
        referrer: window.document.referrer || NOT_REPORTED_VALUE,
        screen: getScreenInfo(),
        ...flowEventData,
        ...eventProperties,
      })
    );
  } catch (e) {
    console.error('AppError', e);
    sentryMetrics.captureException(e);
  }
}

/**
 * Log an event with the view name as a prefix
 */
export function logViewEvent(
  viewName: string,
  eventName: string,
  /* Additional properties to log with the event */
  eventProperties: Hash<any> = {}
) {
  if (viewNamePrefix) {
    viewName = `${viewNamePrefix}.${viewName}`;
  }

  logEvents([`${viewName}.${eventName}`], eventProperties);
}

/**
 * Log when an experiment is shown to the user
 */
export function logExperiment(
  /** Type of experiment */
  choice: string,
  /** Experiment group (treatment or control) */
  group: string,
  /* Additional properties to log with the event */
  eventProperties: Hash<any> = {}
) {
  addExperiment(choice, group);
  logEvents([`experiment.${choice}.${group}`], eventProperties);
}

/**
 * Log when a user preference is updated. Example, two step
 * authentication, adding recovery email or recovery key.
 */
export function setUserPreference(
  /** Name of preference, typically view name */
  prefName: string,
  value: boolean
) {
  configurableProperties.userPreferences = { [prefName]: value };
}

/**
 * Log subscribed newsletters for a user.
 */
export function setNewsletters(newsletters: string[]) {
  configurableProperties.newsletters = newsletters;
}

/**
 * Log participating experiment for a user.
 */
export function addExperiment(
  /** Type of experiment */
  choice: string,
  /** Experiment group (treatment or control) */
  group: string
) {
  const index = configurableProperties.experiments.findIndex(
    (experiment) => experiment.choice === choice
  );
  const experiment: ExperimentGroup = { choice, group };

  if (~index) {
    configurableProperties.experiments[index] = experiment;
  } else {
    configurableProperties.experiments.push(experiment);
  }
}

/**
 * Log when a marketing snippet is shown to the user
 */
export function addMarketingImpression(
  /** URL of marketing link */
  url: string,
  /** Marketing campaign id */
  campaignId?: string
) {
  const impression: MarketingCampaign = {
    campaignId: campaignId || UNKNOWN_VALUE,
    url,
    clicked: false,
  };

  configurableProperties.marketing.push(impression);
}

/**
 * Log whether the user clicked on a marketing link
 */
export function setMarketingClick(url: string, campaignId: string) {
  const index = configurableProperties.marketing.findIndex(
    (impression) =>
      impression.url === url && impression.campaignId === campaignId
  );

  if (index < 0) {
    return;
  }

  configurableProperties.marketing[index].clicked = true;
}
