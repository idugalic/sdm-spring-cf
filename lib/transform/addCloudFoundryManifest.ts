import { NoParameters } from "@atomist/automation-client";
import {
    AutofixRegistration,
    CodeTransform,
} from "@atomist/sdm";
import { CloudFoundryManifestPath } from "@atomist/sdm-pack-cloudfoundry/lib/api/CloudFoundryTarget";
import { HasSpringBootPom, MavenProjectIdentifier } from "@atomist/sdm-pack-spring";

// Simple template for Cloud Foundry manifest
const JavaManifestFor = (name: string, teamId: string) => `---
applications:
- name: "${name}"
  memory: 1024M
  instances: 1
  buildpack: https://github.com/cloudfoundry/java-buildpack.git
  env:
    ATOMIST_TEAM: ${teamId}`;

export const AddCloudFoundryManifestTransform: CodeTransform = async (p, ctx) => {
    const javaId = await MavenProjectIdentifier(p);
    if (javaId && await HasSpringBootPom.predicate(p)) {
        return p.addFile(CloudFoundryManifestPath, JavaManifestFor(javaId.name, ctx.context.workspaceId));
    }
    return ctx.context.messageClient.respond(
        `Unable to add Cloud Foundry manifest to project \`${p.id.owner}:${p.id.repo}\`: Neither Maven nor Node`);
};

export const AddCloudFoundryManifestAutofix: AutofixRegistration<NoParameters> = {
    name: "CloudFoundryManifest",
    transform: AddCloudFoundryManifestTransform,
};
