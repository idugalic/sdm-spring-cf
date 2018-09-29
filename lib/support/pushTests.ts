import { PushTest, pushTest } from "@atomist/sdm";

export const ToProductionBranch: PushTest = pushTest("Push to production branch", async p =>
    p.push.branch === "production");
