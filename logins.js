const uuidv4 = require('uuid').v4;
const log4js = require("log4js");
const mysql = require('mysql2/promise');
const secrets = require('./secrets');
const requestIp = require('request-ip');

// get log object
const logger = log4js.getLogger();

// local connection to the database
let connectionPool = undefined;

const cookieName = "session";

// call at server startup
async function connectToDatabase(config) {
    logger.info('Connecting to logins database...');

    // use connection data from secrets manager
    secrets.getSecretJson(config.logins)
        .then(secret => {
            let pool = mysql.createPool({
                host: secret.host,
                port: secret.port,
                user: secret.username,
                password: secret.password,
                database: secret.dbname,
                waitForConnections: true,
                connectionLimit: 10,
            });

            // set global pool
            connectionPool = pool;
        })

        // log any errors
        .catch(e => {
            logger.error(`Failed to connect to logins DB: ${e.message}`);
        });
}

// create or update a session for a given login and return the session id
async function createSession(email, name, access_token) {
    await insertSession(email, name, access_token);

    // lookup the session ID by email
    let select = `SELECT session FROM logins WHERE email=?`;
    let [rows] = await connectionPool.execute(select, [email]);

    if (rows.length === 0) {
        return undefined;
    }

    // unique, so only 1 row if it exists
    return rows[0].session;
}

// insert or update a new session for a given login
async function insertSession(email, name, access_token) {
    let insert = `
    INSERT INTO logins (email, name, session, access_token, expires)
    VALUES (?, ?, UUID(), ?, NOW() + INTERVAL 2 WEEK)
    ON DUPLICATE KEY UPDATE
        session = VALUES(session),
        name = VALUES(name),
        access_token = VALUES(access_token)
    `;

    // perform the insert
    return await connectionPool.execute(insert, [email, name, access_token]);
}

const anonymous_session = {};

// lookup a session by email
// TODO: might need to be revised given that we are now using express-session?
async function getSession(session) {

    // TODO: might be obsolete given that we are now using express-session?
    if(session in anonymous_session) {
        logger.debug("Anonymous session cookie found!");
        return anonymous_session[session];
    }

    if (connectionPool) {

        logger.debug("Checking for registered user's session cookie!");

        let select = `
        SELECT email, name, access_token, admin FROM logins
        WHERE session=? AND expires>NOW()
        `;

        // run the query, fail if no results
        let [rows] = await connectionPool.execute(select, [session]);
        if (rows.length === 0) {
            return undefined;
        }

        // unique, so only 1 row if it exists
        return rows[0];
    }
    // default if nothing seen
    return undefined;
}

/**
 * Set x-forwarded-for header with inferred client IP, if not already set
 *
 * @return {Function}
 * @public
 */
function captureClientIp() {
    return function (req, res, next) {

        // set x-forwarded-for if not exists
        if (!req.headers['x-forwarded-for']) {

            let fullClientIp = requestIp.getClientIp(req);
            logger.debug('fullClientIp:', fullClientIp);
            let clientIpPart = fullClientIp.split(':');
            logger.debug('clientIpPart:', clientIpPart);
            let clientIp = clientIpPart[clientIpPart.length - 1]
            logger.debug('Client IP:', clientIp);

            req.headers['x-forwarded-for'] = (clientIp === '1' ? '127.0.0.1' : clientIp);
        }
        next();
    };
}

/**
 * Create an anonymous session when no registered user session cookie is detected
 *
 * @return {Function}
 * @public
 */
function captureSession() {
    return function (req, res, next) {

        let session = false;

        req.new_anonymous_session = false;

        if (req.cookies && req.cookies[cookieName]) {
                session = req.cookies[cookieName];
        }

        if (session) {
            logger.debug("Session cookie found: ", session);
        } else {
            logger.debug("Creating new anonymous session?");

            let clientIp = req.headers['x-forwarded-for'];

            // Attempt to create a synthetic but functional session object?
            let anonymous_user = [
                ''.concat("anonymous@", clientIp),
                "anonymous",
                "access_token",
                "false"
            ];

            req.new_anonymous_session = session = uuidv4();
            anonymous_session[session] = anonymous_user;

            // set an anonymous session cookie?
            res.cookie(cookieName, session, {
                domain: req.hostname //require explicit domain set to work with subdomains
            });

            logger.debug('Anonymous session created: ', session, "with user '", anonymous_user, "'");
        }

        next();
    };
}

/**
 * Attempt to set the user identifier for Google Analytics
 *
 * @return {Function}
 * @public
 */
function setUserId() {
    return async function (req, res, next) {

        let session = '';

        if (req.cookies) {
            if(req.cookies[cookieName]) {
                session = req.cookies[cookieName];
            }
        }

        if (!session) {
            // could be a new anonymous public user - retrieve from the request cookie pool?
            if (req.new_anonymous_session) {
                session = req.new_anonymous_session;
            }
        }

        if (session) {

            let userId = '';

            try {

                let userSession = await getSession(session);

                if (userSession) {
                    // get the user id a.k.a. email address
                    // TODO: need to "anonymomize" this but keep it globally unique, maybe using some kind of hash?
                    // userId = userSession[0]; // WRONG! Violates Google Analytics UserID policy?
                    // TODO: perhaps need to store a new field in the dig-dug-server
                    userId = session;  // temporary hack ... not so universal across devices and sessions but...

                } else {
                    logger.debug("No registered user session unavailable for session ID '",session,"'?");
                    userId = session;  // temporary hack ... not so universal across devices and sessions but...
                }

                // if found, set it to visitor
                logger.debug("setUserId(): setting GA Visitor Uid to: ", userId);
                req.visitor.setUid(userId);
            }
            catch(err) {
                logger.debug("setUserId() error: getSession() exception?");
            }
        }

        next();
    };
}

module.exports = {
    connectToDatabase,
    createSession,
    getSession,
    cookieName,
    captureClientIp,
    captureSession,
    setUserId,
};
