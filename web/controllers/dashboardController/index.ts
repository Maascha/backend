import * as Express from "express";
import { where } from "sequelize/types";
import { prisma } from "../../../common/prisma";





export async function establishGrafanaConnection(req: Express.Request, res: Express.Response) {
    console.log("Hallo");
    return res.send("OK - dashboardController is available");
}

export async function registeredStudents(req: Express.Request, res: Express.Response) {
    let from = new Date(Number(req.query.from));
    let to = new Date(Number(req.query.to));
    try {
        const pupilsCount = await prisma.pupil.count({
            where: {
                createdAt: {
                    gt: from,
                    lt: to
                }
            }
        }
        );
        res.json([{"count": pupilsCount}]).status(200).end;
        return res.end;
    } catch (error) {
        return res.status(500).send(`The following error occured:\n\n${error}`);
    }
}
