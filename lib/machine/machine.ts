import {
    AutoCodeInspection,
    Autofix,
    Build,
    GitHubRepoRef,
    goalContributors,
    goals,
    onAnyPush,
    PushImpact,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineConfiguration,
    ToDefaultBranch,
    whenPushSatisfies,
} from "@atomist/sdm";
import {
    createSoftwareDeliveryMachine,
    Version,
} from "@atomist/sdm-core";
import {
    CloudFoundryDeploy, CloudFoundrySupport, HasCloudFoundryManifest,
} from "@atomist/sdm-pack-cloudfoundry";

import {
    CloudNativeGitHubIssueRaisingReviewListener,
    IsMaven,
    MavenBuilder,
    MavenProjectVersioner,
    ReplaceReadmeTitle,
    SetAtomistTeamInApplicationYml,
    SpringProjectCreationParameterDefinitions,
    SpringProjectCreationParameters,
    SpringStyleGitHubIssueRaisingReviewListener,
    springSupport,
    TransformSeedToCustomProject,
} from "@atomist/sdm-pack-spring";

import { CloudFoundryDeploymentStrategy } from "@atomist/sdm-pack-cloudfoundry/lib/goals/CloudFoundryPushDeploy";
import { ToProductionBranch } from "../support/pushTests";
import { AddCloudFoundryManifestAutofix, AddCloudFoundryManifestTransform } from "../transform/addCloudFoundryManifest";
import { AddFinalNameToPom } from "../transform/addFinalName";

export function machine(configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {

    const sdm: SoftwareDeliveryMachine = createSoftwareDeliveryMachine(
        {
            name: "Spring software delivery machine - Cloud Foundry",
            configuration,
        });

    const autofix = new Autofix().with(AddCloudFoundryManifestAutofix);
    const version = new Version().withVersioner(MavenProjectVersioner);
    const inspect = new AutoCodeInspection();

    const build = new Build().with({ name: "Maven", builder: new MavenBuilder(sdm) });

    const cfDeployToStaging = new CloudFoundryDeploy({
        uniqueName: "staging-deployment",
        approval: false,
        preApproval: false,
        retry: true,
    })
       .with({ environment: "staging", strategy: CloudFoundryDeploymentStrategy.CLI });

    const cfDeployToProduction = new CloudFoundryDeploy({
        uniqueName: "production-deployment",
        approval: true,
        preApproval: true,
        retry: true,
    })
        .with({ environment: "production", strategy: CloudFoundryDeploymentStrategy.BLUE_GREEN });

    const BaseGoals = goals("checks")
        .plan(version, autofix, new AutoCodeInspection(), new PushImpact());

    const BuildGoals = goals("build")
        .plan(build)
        .after(autofix, version);

    const DeployToStagingGoals = goals("deploy")
        .plan(cfDeployToStaging)
        .after(build);

    const DeployToProductionGoals = goals("production")
        .plan(cfDeployToProduction)
        .after(build);

    sdm.addGoalContributions(goalContributors(
        onAnyPush().setGoals(BaseGoals),
        whenPushSatisfies(IsMaven).setGoals(BuildGoals),
        whenPushSatisfies(HasCloudFoundryManifest, ToDefaultBranch).setGoals(DeployToStagingGoals),
        whenPushSatisfies(HasCloudFoundryManifest, ToProductionBranch).setGoals(DeployToProductionGoals),
    ));

    sdm.addExtensionPacks(
        springSupport({
            inspectGoal: inspect,
            autofixGoal: autofix,
            review: {
                cloudNative: true,
                springStyle: true,
            },
            autofix: {},
            reviewListeners: [
                CloudNativeGitHubIssueRaisingReviewListener,
                SpringStyleGitHubIssueRaisingReviewListener,
            ],
        }),
        CloudFoundrySupport,
    );

    sdm.addGeneratorCommand<SpringProjectCreationParameters>({
        name: "create-spring",
        intent: "create spring",
        description: "Create a new Java Spring Boot REST service",
        parameters: SpringProjectCreationParameterDefinitions,
        startingPoint: GitHubRepoRef.from({ owner: "atomist-seeds", repo: "spring-rest-seed", branch: "master" }),
        transform: [
            ReplaceReadmeTitle,
            SetAtomistTeamInApplicationYml,
            TransformSeedToCustomProject,
            AddCloudFoundryManifestTransform,
            AddFinalNameToPom,
        ],
    });
    return sdm;
}
