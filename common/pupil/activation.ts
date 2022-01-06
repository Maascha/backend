import { pupil as Pupil, student as Student} from "@prisma/client";
import { getTransactionLog } from "../transactionlog";
import { prisma } from "../prisma";
import DeActivateEvent from "../transactionlog/types/DeActivateEvent";
import { dissolveMatch } from "../match/dissolve";
import * as Notification from "../notification";

export async function activatePupil(pupil: Pupil) {
    if (pupil.active) {
        throw new Error("Pupil was already activated");
    }

    const updatedPupil = await prisma.pupil.update({
        data: { active: true },
        where: { id: pupil.id }
    });

    await getTransactionLog().log(new DeActivateEvent(pupil, true));

    return updatedPupil;
}


export async function deactivatePupil(pupil: Pupil) {
    if (!pupil.active) {
        throw new Error("Pupil was already deactivated");
    }

    let matches = await prisma.match.findMany({
        where: {
            pupilId: pupil.id
        }
    });

    for (const match of matches) {
        await dissolveMatch(match, 0, pupil);
    }

    const updatedPupil = await prisma.pupil.update({
        data: { active: false },
        where: { id: pupil.id }
    });

    await getTransactionLog().log(new DeActivateEvent(pupil, false));

    await Notification.cancelRemindersFor(pupil);

    return updatedPupil;
}