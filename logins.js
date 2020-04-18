const log4js = require("log4js");
const mysql = require('mysql2/promise');
const secrets = require('./secrets');
const requestIp = require('request-ip');

// get log object
const logger = log4js.getLogger();

// local connection to the database
let connectionPool = undefined;

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

    if (rows.length == 0) {
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

// lookup a session by email
async function getSession(session) {
    let select = `
    SELECT email, name, access_token, admin FROM logins
    WHERE session=? AND expires>NOW()
    `;

    // run the query, fail if no results
    let [rows] = await connectionPool.execute(select, [session]);
    if (rows.length == 0) {
        return undefined;
    }

    // unique, so only 1 row if it exists
    return rows[0];
}


// middleware that creates an anonymous session when no registered user session is seen
const getOrCreateSession = function (req, res, next) {

        let fullClientIp = requestIp.getClientIp(req);
        logger.debug('fullClientIp:', fullClientIp);
        let clientIpPart = fullClientIp.split(':');
        logger.debug('clientIpPart:', clientIpPart);
        let clientIp = clientIpPart[clientIpPart.length - 1]
        logger.debug('Client IP:', clientIp);

        logger.debug("Request Headers:\n", JSON.stringify(req.headers));
        logger.debug('Request Type:', req.method);

        let session = false;
        if (req.cookies) {
            session = req.cookies.session;
        }

        if (session) {
            logger.debug('Session found! User email:', session[0]);
        } else {
            // Attempt to create a synthetic but functional session object?
            session = [
                ''.concat("anonymous@",clientIp),
                "anonymous",
                "access_token",
                "false"
            ];
            // spoof the request to include the new session cookie as well?
            req.cookies.session = res.cookie("session", session, {
                domain: req.hostname //require explicit domain set to work with subdomains
            });
        }
        logger.debug('Session: ', session);

        next();
    };

module.exports = {
    connectToDatabase,
    createSession,
    getSession,
    getOrCreateSession,
};
