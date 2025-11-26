#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Lab3Infra9020861Stack } from '../lib/lab3-infra-9020861-stack';
import { Lab3Pipeline9020861Stack } from '../lib/lab3-pipeline-9020861-stack';

const app = new cdk.App();

// Infra stack (deployed by the pipeline)
new Lab3Infra9020861Stack(app, 'Lab3Infra9020861Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Pipeline stack (we deploy this manually once)
new Lab3Pipeline9020861Stack(app, 'Lab3Pipeline9020861Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
