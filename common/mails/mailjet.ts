import {mailjetSmtp} from "./config";
import * as mailjetAPI from "node-mailjet";
import {getLogger} from "log4js";

const logger = getLogger();

async function sendMessage(message: mailjetAPI.Email.SendParamsMessage, sandbox: boolean = false) {
    //determine whether we have sandbox mode or not...
    let sandboxMode = sandbox;

    if (process.env.MAILJET_LIVE === "TEST") {
        message.Subject = `[TEST] ${message.Subject}`;
        logger.warn("Mailjet API sending in TEST/DEV MODE!");
    }
    //if mailjet is not set to live (via envs), always switch to sandbox, no matter what the sandbox-Parameter is set to
    else if (process.env.MAILJET_LIVE != "1") {
        logger.warn("Mailjet API not sending: MAILJET_LIVE not set");
        sandboxMode = true;
    }

    const mailjet = mailjetAPI.connect(mailjetSmtp.auth.user, mailjetSmtp.auth.pass);

    //send actual email
    let requestOptions: mailjetAPI.Email.SendParams = {
        SandboxMode: sandboxMode,
        Messages: [
            message
        ]
    };

    //log what is sent to mailjet, so we can better debug some problems with mails
    logger.info(`Sending send-request to Mailjet: ${JSON.stringify(requestOptions)}`);

    return await mailjet.post("send", {version: "v3.1"}).request(requestOptions);
}

async function sendSMS(message: string, phoneNumber: string, sender: string) {
    if (sender.length > 11) {
        throw new Error('Sender ' + sender + ' is too long! Maximum is 11 characters.');
    }

    const mailjet = mailjetAPI.connect(mailjetSmtp.auth.user, mailjetSmtp.auth.pass);

    // Send actual SMS
    let requestOptions: mailjetAPI.SMS.SendParams = {
        Text: message,
        To: phoneNumber,
        From: sender
    };

    //log what is sent to mailjet, so we can better debug some problems with mails
    logger.info(`Sending sms-send-request to Mailjet: ${JSON.stringify(requestOptions)}`);

    return await mailjet.post("sms-send", {version: "v4"}).request(requestOptions);
}

async function sendMailPure(
    subject: string,
    text: string,
    senderAddress: string,
    receiverAddress: string,
    senderName?: string,
    receiverName?: string,
    replyToAddress?: string,
    replyToName?: string,
    sandbox: boolean = false
) {
    // construct mailjet API message
    const message: mailjetAPI.Email.SendParamsMessage = {
        From: {
            Email: senderAddress,
            Name: senderName
        },
        To: [
            {
                Email: receiverAddress,
                Name: receiverName
            }
        ],
        Subject: subject,
        TextPart: text
    };

    if (replyToAddress) {
        message.ReplyTo = {
            Email: replyToAddress,
            Name: replyToName
        };
    }

    return await sendMessage(message, sandbox);
}

async function sendMailTemplate(
    subject: string,
    senderAddress: string,
    receiverAddress: string,
    templateID: number,
    variables: object,
    sandbox: boolean = false,
    replyToAddress?: string,
    attachements?: {
        ContentType: string,
        Filename: string,
        Base64Content: string
    }[]
) {
    const message: mailjetAPI.Email.SendParamsMessage = {
        From: {
            Email: senderAddress
        },
        To: [
            {
                Email: receiverAddress
            }
        ],
        TemplateID: templateID,
        TemplateLanguage: true,
        Variables: variables,
        Subject: subject,
        Attachments: attachements
    };

    if (replyToAddress) {
        message.ReplyTo = {
            Email: replyToAddress
        };
    }

    return await sendMessage(message, sandbox);
}

const ErrorCodes = {
    RATE_LIMIT: 429,
    NOT_AUTHORIZED: 401
};

export default {
    sendTemplate: sendMailTemplate,
    sendPure: sendMailPure,
    sendSMS: sendSMS,
    ErrorCodes: ErrorCodes
};
