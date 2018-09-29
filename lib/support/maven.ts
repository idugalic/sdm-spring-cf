import {
    spawnAndWatch,
    SuccessIsReturn0ErrorFinder,
} from "@atomist/automation-client";
import { PrepareForGoalExecution } from "@atomist/sdm";

export const MavenPackage: PrepareForGoalExecution = async (p, r) => {
    const result = await spawnAndWatch({
            command: "mvn",
            args: ["package", "-DskipTests=true", `-Dartifact.name=${r.id.repo}`],
        }, {
            cwd: p.baseDir,
        },
        r.progressLog,
        {
            errorFinder: SuccessIsReturn0ErrorFinder,
        });
    return result;
};
