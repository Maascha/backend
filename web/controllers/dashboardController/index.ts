import * as Express from "express";
import { where } from "sequelize/types";
import { prisma } from "../../../common/prisma";





export async function establishGrafanaConnection(req: Express.Request, res: Express.Response) {
    console.log("Hallo");
    return res.send("OK - dashboardController is available");
}

export async function registeredStudents(req: Express.Request, res: Express.Response) {
    console.log(req);
    try {
        const pupilsCount = await prisma.pupil.count({
            where: {
                createdAt: {
                    gt: new Date("2021-10-25T00:00:00")
                }
            }
        }
        );
        return res.json([
            {
                "columns": [
                    {"text": "count", "type": "number"}
                ],
                "rows": [ [pupilsCount] ],
                "type": "table"
            }
        ]).end;
    } catch (error) {
        return res.status(500).send(`The following error occured:\n\n${error}`);
    }
}
