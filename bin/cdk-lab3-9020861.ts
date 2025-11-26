#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Lab3Infra9020861Stack } from '../lib/lab3-infra-9020861-stack';

const app = new cdk.App();

new Lab3Infra9020861Stack(app, 'Lab3Infra9020861Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
