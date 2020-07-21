/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Joi = require('@hapi/joi');

const logger = require('../../logging')('routes.ecosystem_anon_id.post');
const notifyProfileUpdated = require('../../updates-queue');
const AppError = require('../../error');
const config = require('../../config');
const request = require('../../request');

const AUTH_SERVER_URL =
  config.get('authServer.url') + '/account/ecosystemAnonId';

const updateAuthServer = function (
  credentials,
  ecosystemAnonId,
  unmodifiedSinceValue
) {
  const headers = {
    Authorization: 'Bearer ' + credentials.token,
  };

  if (unmodifiedSinceValue) {
    headers['If-Unmodified-Since'] = unmodifiedSinceValue;
  }

  return new Promise((resolve, reject) => {
    request.get(
      AUTH_SERVER_URL,
      {
        headers,
        body: {
          ecosystemAnonId,
        },
        json: true,
      },
      (err, res, body) => {
        if (err) {
          logger.error('request.auth_server.network', err);
          return reject(new AppError.authError('network error'));
        }

        if (res.statusCode >= 400) {
          body = body && body.code ? body : { code: res.statusCode };

          if (res.statusCode >= 500) {
            logger.error('request.auth_server.fail', body);
            return reject(new AppError.authError('auth-server server error'));
          }

          if (body.code === 401 || body.errno === 102) {
            logger.info('request.auth_server.fail', body);
            return reject(new AppError.unauthorized(body.message));
          }

          if (body.code === 412 || body.errno === 190) {
            logger.info('request.auth_server.precondition_fail', body);
            return reject(new AppError.anonIdModifiedSince());
          }

          logger.error('request.auth_server.fail', body);
          return reject(
            new AppError({
              code: 500,
              message: 'error communicating with auth server',
            })
          );
        }

        return resolve();
      }
    );
  });
};

module.exports = {
  auth: {
    strategy: 'oauth',
    scope: ['profile:ecosystem_anon_id:write'],
  },
  validate: {
    payload: {
      ecosystemAnonId: Joi.string().required(),
    },
  },
  handler: async function ecosystemAnonIdPost(req) {
    return req.server
      .inject({
        allowInternals: true,
        method: 'get',
        url: '/v1/_core_profile',
        headers: req.headers,
        auth: {
          credentials: req.auth.credentials,
          strategy: 'oauth',
        },
      })
      .then(async (res) => {
        const uid = req.auth.credentials.user;
        // const existingAnonId = res.result.ecosystemAnonId;
        const ageOfAnonId = 1234567;
        const unmodifiedSinceValue = req.headers['if-unmodified-since'];
        const unmodifiedSince = Date.parse(unmodifiedSinceValue);

        logger.info('activityEvent', {
          event: 'ecosystemAnonId.post',
          uid: uid,
        });

        if (!isNaN(unmodifiedSince) && ageOfAnonId > unmodifiedSince) {
          throw new AppError.anonIdModifiedSince();
        }

        await req.server.methods.profileCache.drop(uid);
        await updateAuthServer(
          req.auth.credentials,
          req.payload.ecosystemAnonId,
          unmodifiedSinceValue
        );

        notifyProfileUpdated(uid);
        return {};
      });
  },
};
