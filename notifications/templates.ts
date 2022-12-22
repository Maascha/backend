import { MessageType } from './messageTypes';
import { Concrete_notification as ConcreteNotification } from '../graphql/generated';
import { NotificationMessage } from '../graphql/types/notificationMessage';
import { User } from '../common/user';

export const getMessage = (concreteNotification: ConcreteNotification, user?: User): NotificationMessage => {
    const { firstname, lastname } = user ? user : { firstname: '', lastname: '' };
    const { notificationID, context } = concreteNotification;

    const templates: { [key: number]: NotificationMessage } = {
        1: {
            headline: `bla bla ${firstname}`,
            body: `bla bla ${firstname} bla bla ${lastname}`,
            navigateTo: `http://www.somewhere`,
            isUrlExternal: true,
            messageType: MessageType.APPOINTMENT,
        },
        2: {
            headline: `bla bla ${firstname}`,
            body: `bla bla ${firstname} bla bla ${lastname}`,
            navigateTo: 'welcome',
            messageType: MessageType.COURSE,
        },
        3: {
            headline: `bla bla ${firstname}`,
            body: `bla bla ${firstname} bla bla ${lastname}`,
            messageType: MessageType.MESSAGE,
        },
        4: {
            headline: `bla bla ${firstname}`,
            body: `bla bla ${firstname} bla bla ${lastname}`,
            navigateTo: `http://www.somewhere`,
            isUrlExternal: true,
            messageType: MessageType.CHAT,
        },
        5: {
            headline: `bla bla ${firstname}`,
            body: `bla bla ${firstname} bla bla ${lastname}`,
            navigateTo: 'welcome',
            messageType: MessageType.NEWS,
        },
        6: {
            headline: `bla bla ${firstname}`,
            body: `bla bla ${firstname} bla bla ${lastname}`,
            messageType: MessageType.SURVEY,
        },
        29: {
            headline: `User Login Notification ${concreteNotification.id}`,
            body: `Hello ${firstname} ${lastname} template ${concreteNotification.notificationID} :)`,
            messageType: MessageType.MATCH,
        },
    };

    if (templates.hasOwnProperty(notificationID)) {
        return templates[notificationID];
    }

    return {
        headline: `Message ${concreteNotification.id} not found`,
        body: `Error: template ${concreteNotification.notificationID} not found.`,
        messageType: MessageType.MATCH,
        error: 'Template for notification does not exist',
    };
};
