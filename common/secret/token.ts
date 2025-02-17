import { SecretType } from '../entity/Secret';
import { getUser, getUserTypeORM, User } from '../user';
import { prisma } from '../prisma';
import { v4 as uuid } from 'uuid';
import { hashToken } from '../util/hashing';
import * as Notification from '../notification';
import { getLogger } from 'log4js';
import { isDev, USER_APP_DOMAIN } from '../util/environment';

const logger = getLogger('Token');

export async function revokeToken(user: User, id: number) {
    const result = await prisma.secret.deleteMany({ where: { id, userId: user.userID } });
    if (result.count !== 1) {
        throw new Error(`Failed to revoke token, does not exist`);
    }

    logger.info(`User(${user.userID}) revoked token Secret(${id})`);
}

export async function revokeTokenByToken(user: User, token: string) {
    const hash = hashToken(token);
    const secret = await prisma.secret.findFirst({
        where: { secret: hash, userId: user.userID },
    });
    if (!secret) {
        throw new Error(`Secret not found`);
    }

    await prisma.secret.delete({ where: { id: secret.id } });

    logger.info(`User(${user.userID}) revoked token Secret(${secret.id})`);
}

// The token returned by this function MAY NEVER be persisted and may only be sent to the user
export async function createToken(user: User, expiresAt: Date | null = null, description: string | null = null): Promise<string> {
    const token = uuid();
    const hash = hashToken(token);

    const result = await prisma.secret.create({
        data: {
            type: SecretType.TOKEN,
            userId: user.userID,
            secret: hash,
            expiresAt,
            lastUsed: null,
            description,
        },
    });

    logger.info(`User(${user.userID}) created token Secret(${result.id})`);

    return token;
}

// NOTE: Only use for testing purposes
export async function _createFixedToken(user: User, token: string): Promise<void> {
    const hash = hashToken(token);

    const result = await prisma.secret.create({
        data: {
            type: SecretType.TOKEN,
            userId: user.userID,
            secret: hash,
            expiresAt: null,
            lastUsed: null,
        },
    });
    logger.info(`User(${user.userID}) created token Secret(${result.id})`);
}

// Sends the token to the user via E-Mail using one of the supported Notification actions (to distinguish the user messaging around the token login)
// Also a redirectTo URL is provided which is passed through to the frontend
export async function requestToken(user: User, action: 'user-verify-email' | 'user-authenticate' | 'user-password-reset', redirectTo?: string) {
    const token = await createSecretEmailToken(user);
    const person = await getUserTypeORM(user.userID);

    if (redirectTo) {
        // Ensures that the user is not redirected to a potential third party
        const { host } = new URL(redirectTo, `https://${USER_APP_DOMAIN}/`);
        if (!isDev && !host.endsWith('lern-fair.de')) {
            throw new Error(`Invalid redirectTo host '${host}'`);
        }

        // Base64 encode, as the redirectTo might be placed as a query parameter in an URL
        redirectTo = Buffer.from(redirectTo, 'utf-8').toString('base64');
    }

    await Notification.actionTaken(person, action, { token, redirectTo: redirectTo ?? '' });
}

// The token returned by this function MAY NEVER be persisted and may only be sent to the user by email
export async function createSecretEmailToken(user: User) {
    const token = uuid();
    const hash = hashToken(token);

    const result = await prisma.secret.create({
        data: {
            type: SecretType.EMAIL_TOKEN,
            userId: user.userID,
            secret: hash,
            expiresAt: null,
            lastUsed: null,
        },
    });

    logger.info(`Created a new email token Secret(${result.id}) for User(${user.userID})`);

    return token;
}

export async function loginToken(token: string): Promise<User | never> {
    const secret = await prisma.secret.findFirst({
        where: {
            secret: hashToken(token),
            type: { in: [SecretType.EMAIL_TOKEN, SecretType.TOKEN] },
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
    });

    if (!secret) {
        throw new Error(`Invalid Token`);
    }

    const user = await getUser(secret.userId, /* active */ true);

    if (secret.type === SecretType.EMAIL_TOKEN) {
        await prisma.secret.delete({ where: { id: secret.id } });
        logger.info(`User(${user.userID}) logged in with email token Secret(${secret.id}), revoked token`);
    } else {
        await prisma.secret.update({ data: { lastUsed: new Date() }, where: { id: secret.id } });
        logger.info(`User(${user.userID}) logged in with persistent token Secret(${secret.id})`);
    }

    if (secret.type === SecretType.EMAIL_TOKEN) {
        await verifyEmail(user);
    }

    return await user;
}

export async function verifyEmail(user: User) {
    if (user.studentId) {
        const { verifiedAt, verification } = await prisma.student.findUniqueOrThrow({
            where: { id: user.studentId },
            select: { verifiedAt: true, verification: true },
        });
        if (!verifiedAt || verification) {
            await prisma.student.update({
                data: { verifiedAt: new Date(), verification: null },
                where: { id: user.studentId },
            });

            logger.info(`Student(${user.studentId}) verified their e-mail by logging in with an e-mail token`);
        }
    }

    if (user.pupilId) {
        const { verifiedAt, verification } = await prisma.pupil.findUniqueOrThrow({
            where: { id: user.pupilId },
            select: { verifiedAt: true, verification: true },
        });
        if (!verifiedAt || verification) {
            await prisma.pupil.update({
                data: { verifiedAt: new Date(), verification: null },
                where: { id: user.pupilId },
            });

            logger.info(`Pupil(${user.pupilId}) verified their e-mail by logging in with an e-mail token`);
        }
    }
}
