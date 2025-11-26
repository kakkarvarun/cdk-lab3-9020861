import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export class Lab3Pipeline9020861Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // === 1) Artifacts for Source and Build ===
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // === 2) Source stage: GitHub via CodeStar connection ===
    const sourceAction = new cpactions.CodeStarConnectionsSourceAction({
      actionName: 'GitHub_Source',
      owner: 'kakkarvarun',           // TODO: change this
      repo: 'cdk-lab3-9020861',                  // repo name
      branch: 'main',
      connectionArn: 'arn:aws:codeconnections:us-east-1:699475949483:connection/e95425b2-007d-4bcc-9a84-0768ed9e0108', // TODO: paste your connection ARN here
      output: sourceOutput,
      triggerOnPush: true, // automatically trigger on GitHub push
    });

    // === 3) Build stage: CodeBuild running buildspec.yml ===
    const project = new codebuild.PipelineProject(this, 'Lab3BuildProject9020861', {
      projectName: 'lab3-cdk-build-9020861',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
    });

    const buildAction = new cpactions.CodeBuildAction({
      actionName: 'CDK_Synth',
      project,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // === 4) Deploy stage: CloudFormation create/update stack ===
    const deployAction = new cpactions.CloudFormationCreateUpdateStackAction({
      actionName: 'Deploy_Lab3Infra',
      stackName: 'Lab3Infra9020861Stack',
      templatePath: buildOutput.atPath('cdk.out/Lab3Infra9020861Stack.template.json'),
      adminPermissions: true, // gives CloudFormation enough permissions
    });

    // === 5) Pipeline definition ===
    new codepipeline.Pipeline(this, 'Lab3Pipeline9020861', {
      pipelineName: 'lab3-cdk-pipeline-9020861',
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Deploy',
          actions: [deployAction],
        },
      ],
    });
  }
}
