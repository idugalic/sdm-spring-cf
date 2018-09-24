import {
    AnyPush,
    ArtifactGoal,
    AutoCodeInspection,
    Autofix,
    Build,
    executeDeploy,
    GitHubRepoRef,
    goalContributors,
    goals,
    not,
    onAnyPush,
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    ProductionUndeploymentGoal,
    PushImpact,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineConfiguration,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    ToDefaultBranch,
    whenPushSatisfies,
} from "@atomist/sdm";
import {
    createSoftwareDeliveryMachine,
    DisableDeploy,
    DisplayDeployEnablement,
    EnableDeploy,
    ExplainDeploymentFreezeGoal,
    InMemoryDeploymentStatusManager,
    isDeploymentFrozen,
    Version,
} from "@atomist/sdm-core";
import {
    CloudFoundryBlueGreenDeployer, CloudFoundrySupport, EnvironmentCloudFoundryTarget, HasCloudFoundryManifest,
} from "@atomist/sdm-pack-cloudfoundry";

import {
    IsMaven,
    MavenBuilder,
    MavenProgressReporter,
    MavenProjectVersioner,
    ReplaceReadmeTitle,
    SetAtomistTeamInApplicationYml,
    SpringProjectCreationParameterDefinitions,
    SpringProjectCreationParameters,
    SpringSupport,
    TransformSeedToCustomProject,
} from "@atomist/sdm-pack-spring";

import { AddCloudFoundryManifestAutofix } from "../transform/addCloudFoundryManifest";
import { AddFinalNameToPom } from "../transform/addFinalName";

const freezeStore = new InMemoryDeploymentStatusManager();

const IsDeploymentFrozen = isDeploymentFrozen(freezeStore);

export function machine(configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {

    const sdm: SoftwareDeliveryMachine = createSoftwareDeliveryMachine(
        {
            name: "Spring software delivery machine",
            configuration,
        });

    const autofix = new Autofix().with(AddCloudFoundryManifestAutofix);
    const version = new Version().withVersioner(MavenProjectVersioner);

    const build = new Build().with({
        builder: new MavenBuilder(sdm),
        progressReporter: MavenProgressReporter,
    });

    const BaseGoals = goals("checks")
        .plan(version, autofix, new AutoCodeInspection(), new PushImpact());

    const BuildGoals = goals("build")
        .plan(build)
        .after(autofix, version);

    const StagingDeploymentGoals = goals("deploy-stage")
        .plan(ArtifactGoal, StagingDeploymentGoal, StagingEndpointGoal)
        .after(build);
    const ProductionDeploymentGoals = goals("deploy-prod")
        .plan(ArtifactGoal, ProductionDeploymentGoal, ProductionEndpointGoal);

    sdm.addGoalContributions(goalContributors(
        onAnyPush().setGoals(BaseGoals),
        whenPushSatisfies(IsDeploymentFrozen).setGoals(ExplainDeploymentFreezeGoal),
        whenPushSatisfies(IsMaven).setGoals(BuildGoals),
        whenPushSatisfies(HasCloudFoundryManifest, ToDefaultBranch).setGoals(StagingDeploymentGoals),
        whenPushSatisfies(HasCloudFoundryManifest, not(IsDeploymentFrozen), ToDefaultBranch)
            .setGoals(ProductionDeploymentGoals),
    ));

    sdm.addExtensionPacks(
        SpringSupport,
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
            AddFinalNameToPom,
        ],
    });
    deployRules(sdm);
    return sdm;
}

export function deployRules(sdm: SoftwareDeliveryMachine): void {
    const deployToStaging = {
        deployer: new CloudFoundryBlueGreenDeployer(sdm.configuration.sdm.projectLoader),
        targeter: () => new EnvironmentCloudFoundryTarget("staging"),
        deployGoal: StagingDeploymentGoal,
        endpointGoal: StagingEndpointGoal,
        undeployGoal: ProductionUndeploymentGoal,

    };
    sdm.addGoalImplementation("Staging local deployer",
        deployToStaging.deployGoal,
        executeDeploy(
            sdm.configuration.sdm.artifactStore,
            sdm.configuration.sdm.repoRefResolver,
            deployToStaging.endpointGoal, deployToStaging),
        {
            pushTest: IsMaven,
            logInterpreter: deployToStaging.deployer.logInterpreter,
        },
    );
    sdm.addGoalSideEffect(
        deployToStaging.endpointGoal,
        deployToStaging.deployGoal.definition.displayName,
        AnyPush);

    const deployToProduction = {
        deployer: new CloudFoundryBlueGreenDeployer(sdm.configuration.sdm.projectLoader),
        targeter: () => new EnvironmentCloudFoundryTarget("production"),
        deployGoal: ProductionDeploymentGoal,
        endpointGoal: ProductionEndpointGoal,
        undeployGoal: ProductionUndeploymentGoal,
    };
    sdm.addGoalImplementation("Production CF deployer",
        deployToProduction.deployGoal,
        executeDeploy(
            sdm.configuration.sdm.artifactStore,
            sdm.configuration.sdm.repoRefResolver,
            deployToProduction.endpointGoal, deployToProduction),
        {
            pushTest: IsMaven,
            logInterpreter: deployToProduction.deployer.logInterpreter,
        },
    );
    sdm.addGoalSideEffect(
        deployToProduction.endpointGoal,
        deployToProduction.deployGoal.definition.displayName,
        AnyPush);

    sdm.addCommand(EnableDeploy)
        .addCommand(DisableDeploy)
        .addCommand(DisplayDeployEnablement);
}
