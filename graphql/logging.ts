import { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener } from "apollo-server-plugin-base";
import { getLogger } from "log4js";
import { GraphQLContext } from "./context";

const logger = getLogger("GraphQL");
const isDev = process.env.NODE_ENV === "dev";

export const GraphQLLogger: ApolloServerPlugin = {
    async requestDidStart(requestContext) {
        logger.debug(`Request did start`);

        return {
            async didResolveOperation(requestContext) {
                logger.debug(`Starting Operation ${requestContext.operationName}`);
            },
            async didEncounterErrors(requestContext) {
                logger.warn(`An error  occured:`, requestContext.errors);
            },
            async willSendResponse(requestContext) {
                logger.debug(`Processed the query:\n${requestContext.request.query}`);

                if (requestContext.errors.length) {
                    logger.warn(`The following errors occured:`, requestContext.errors);
                } else if (isDev) {
                    logger.debug(`Successfully processed, responding with`, requestContext.response.data);
                } else {
                    logger.debug(`Successfully processed query`);
                }
            }
        };
    }
};