/**
 * Protocol data
 */
const AROMA_PROTOCOL_VERSION = '0.0.5';
const AROMA_SECURE_PORT = 1990;
const AROMA_PORT = 1989;
const AROMA_PATH = 'aromachat/chat';

/**
 * Available events
 */
const AromaEvent = {
    establish: 'establish',
    login: 'login',
    logout: 'logout',
    join: 'join',
    leave: 'leave',
    usermessage: 'usermessage',
    userlogin: 'userlogin',
    userlogout: 'userlogout',
    userjoin: 'userjoin',
    userleave: 'userleave'
};

/**
 * Available errors
 */
const AromaError = {
    wserror: 'wserror',
    disconnect: 'disconnect',
    invalidtype: 'invalidtype',
    unknwonhost: 'unknownhost'
};


/**
 * A client
 * @author Alessandro-Salerno
 */
class AromaClient {
    /**
     * 
     * @param {str} targetHost the address of the server
     * @param {str} username the username to be used
     */
    constructor(targetHost, username) {
        this.targetHost = targetHost;
        this.username = username;

        // Connection-related information
        this.ws = null;
        this.connected = false; // Unused
        this.loggedin = false; // Unused
        this.textChannel = null;

        // Event listeners
        this.eventListeners = {
            onestablish: [],
            onlogin: [],
            onlogout: [],
            onjoin: [],
            onleave: [],
            onusermessage: [],
            onuserlogin: [],
            onuserlogout: [],
            onuserjoin: [],
            onuserleave: []
        };

        // Erro handlers
        this.errorHandlers = {
            onwserror: [],
            ondisconnect: [],
            oninvalidtype: [],
            onunknownhost: []
        };
    }

    
    /**
 *   * Call all event handlers
     * @param {str} event the event frame
     * @param {str} eventType the event type
     */
    callEventListeners(event, eventType) {
        this.eventListeners[`on${eventType}`].forEach(eventListener => {
            eventListener(event);
        });
    }

    /**
     * Call all error handlers
     * @param {str} error the error frame
     * @param {str} errorType the error type
     */
    callErrorHandlers(error, errorType) {
        this.errorHandlers[`on${errorType}`].forEach(errorHandler => {
            errorHandler(error);
        });
    }

    /**
     * Connect to the server
     */
    connect() {
        this.ws = new WebSocket(`ws://${this.targetHost}:${AROMA_PORT}/${AROMA_PATH}?username=${this.username}&protocol=${AROMA_PROTOCOL_VERSION}`);

        // // Trigger 'establish' event
        // this.ws = connection.socket;
        // this.callEventListeners({ address: this.targetHost, secure: connection.secure }, AromaEvent.establish);

        this.ws.onmessage = (event) => {
            // Parse JSON message
            const packet = JSON.parse(event.data);

            // Check that the message type is valid
            if (!packet.type in AromaEvent) {
                this.callErrorHandlers({}, AromaError.invalidtype);
                return;
            }

            // If the message type is valid, call the designated event listener
            this.callEventListeners(packet, packet.type);
        };

        this.ws.onerror = (event) => {
            // Forward WS errors to error handlers
            this.callErrorHandlers(event, AromaError.wserror);
        };

        this.ws.onclose = (event) => {
            // If the connection has been closed without errors
            if (event.code == 1000) {
                this.callEventListeners(event, AromaEvent.logout);
                return;
            }

            // Call error handler if the connection has been closed with an error code
            this.callErrorHandlers(event, AromaError.disconnect);
        };
    }

    /**
     * Send a user-message to the server
     * @param {str} message the message to be sent
     */
    sendMessage(message) {
        this.ws.send(JSON.stringify({
            type: AromaEvent.usermessage,
            content: message,
        }));
    }

    /**
     * Add an event listener
     * @param {str} eventType the event type of the event listener
     * @param {function} eventListener the event listener function
     */
    addEventListener(eventType, eventListener) {
        this.eventListeners[`on${eventType}`].push(eventListener);
    }

    /**
     * Add an error handler
     * @param {str} errorType the error type of the error listener
     * @param {function} errorHandler the error handler itself
     */
    addErrorHandler(errorType, errorHandler) {
        this.errorHandlers[`on${errorType}`].push(errorHandler);
    }

    /**
     * Connect to a text channel on the remote server
     * @param {str} channel the channel
     */
    joinTextChannel(channel) {
        this.ws.send(JSON.stringify({
            type: AromaEvent.join,
            channel: channel
        }));

        this.textChannel = channel;
    }

    /**
     * Leave the current text channel on the remote server
     */
    leaveTextChannel() {
        this.ws.send(JSON.stringify({
            type: AromaEvent.leave
        }));

        this.textChannel = null;
    }
}
