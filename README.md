# In-Class Lab 3 – Automated Infrastructure Deployment with AWS CDK & CodePipeline  
**Student:** Varun  
**Student ID:** 9020861  
**Repo:** `cdk-lab3-9020861`  
**Region:** `us-east-1`  
**Account:** Personal AWS Free Tier

This lab shows how I used **AWS CDK** and **AWS CodePipeline** to automatically build and deploy a small AWS infrastructure:

- **Lambda function**
- **HTTP API Gateway** with a `/hello` endpoint
- **S3 bucket**

Everything is deployed via a **3-stage CodePipeline** (Source → Build → Deploy) that runs whenever I push changes to my GitHub repo.

---

## 1. High-Level Architecture (Simple View)

1. I write **infrastructure as code** in **TypeScript** using **AWS CDK**.
2. The CDK **Infra stack** defines:
   - An **S3 bucket** (for demo / config)
   - A **Lambda function**
   - An **HTTP API Gateway** with `GET /hello` → Lambda
3. The CDK **Pipeline stack** defines:
   - A **CodeStar connection** to GitHub
   - A **CodePipeline** with 3 stages:
     - **Source** (GitHub)
     - **Build** (CodeBuild – runs `cdk synth`)
     - **Deploy** (CloudFormation – uses synthesized template)
4. When I push to **GitHub main branch**, the pipeline:
   - Pulls the latest code
   - Synthesizes CloudFormation template from the CDK code
   - Deploys or updates my infra stack automatically

---

## 2. CDK Stacks Overview

This CDK app has **two stacks**:

### 2.1 `Lab3Infra9020861Stack` (Infrastructure Stack)

File: `lib/lab3-infra-9020861-stack.ts`

Resources:

1. **S3 Bucket**
   - CDK id: `Lab3Bucket9020861`
   - Name (example): `vk-9020861-lab3-bucket`
   - Properties:
     - `removalPolicy: DESTROY` (dev/test only)
   - Purpose:
     - Example storage bucket and environment variable for Lambda.

2. **Lambda Function**
   - CDK id: `HelloLambda9020861`
   - Function name: `lab3-hello-lambda-9020861`
   - Runtime: **Node.js 18 (NODEJS_18_X)**
   - Handler: `index.handler`
   - Code: Inline JavaScript that:
     - Logs the incoming event.
     - Reads environment variables `BUCKET_NAME` and `STUDENT_NAME`.
     - Returns a JSON body like:

       ```json
       {
         "message": "Hello from Lambda via API Gateway (Lab 3)!",
         "studentId": "9020861",
         "bucketName": "vk-9020861-lab3-bucket",
         "name": "Varun"
       }
       ```

   - Environment variables:
     - `BUCKET_NAME` – name of the S3 bucket.
     - `STUDENT_NAME` – default `"Varun"`.

   - Permissions:
     - S3 bucket grants **read/write** to this Lambda.

3. **HTTP API Gateway (v2)**

   - CDK id: `Lab3HttpApi9020861`
   - API name: `lab3-http-api-9020861`
   - Route:
     - `GET /hello` → integrated with the Lambda function.
   - Integration:
     - `HttpLambdaIntegration` from `aws-apigatewayv2-integrations`.
   - Output:
     - CDK `CfnOutput` named `HelloApiUrl` that prints the full URL:

       ```
       https://<id>.execute-api.us-east-1.amazonaws.com/hello
       ```

   This satisfies the lab requirement:

   > “Create an API Gateway (HTTP or REST) that integrates with Lambda and exposes at least one endpoint: GET /hello.”

---

### 2.2 `Lab3Pipeline9020861Stack` (Pipeline Stack)

File: `lib/lab3-pipeline-9020861-stack.ts`

This stack defines the **CI/CD pipeline itself** using CDK:

1. **Source Stage – GitHub via CodeStar Connection**

   - Uses `CodeStarConnectionsSourceAction`.
   - Connection: `github-connection-lab3-9020861` (created in AWS Developer Tools → Connections).
   - Points to:
     - Owner: `<my-github-username>`
     - Repo: `cdk-lab3-9020861`
     - Branch: `main`
   - `triggerOnPush: true` so any push to `main` starts the pipeline.
   - Output artifact: `SourceOutput`.

2. **Build Stage – CodeBuild with buildspec.yml**

   - Uses `PipelineProject` named: `lab3-cdk-build-9020861`.
   - Environment:
     - Linux standard image: `STANDARD_7_0`.
   - BuildSpec: `buildspec.yml` from the repo.

   `buildspec.yml`:

   ```yaml
   version: 0.2

   phases:
     install:
       commands:
         - npm install -g aws-cdk
         - npm install
     build:
       commands:
         - echo "Synthesizing Lab3Infra9020861Stack for student 9020861..."
         - cdk synth Lab3Infra9020861Stack

   artifacts:
     files:
       - 'cdk.out/Lab3Infra9020861Stack.template.json'

Install CDK + dependencies

Run cdk synth

Output the CloudFormation template as an artifact

Build action:

Input: SourceOutput

Output: BuildOutput (contains cdk.out/Lab3Infra9020861Stack.template.json)

3. Deploy Stage – CloudFormation Create/Update Stack

Uses CloudFormationCreateUpdateStackAction.

Stack name: Lab3Infra9020861Stack

Template path: BuildOutput → cdk.out/Lab3Infra9020861Stack.template.json

adminPermissions: true to allow CloudFormation to create/update the stack.

“Deploy stage that deploys the CDK-generated template, reading it from the Build Stage artifact.”

4. Pipeline

Pipeline name: lab3-cdk-pipeline-9020861

Stages:

Source → GitHub

Build → CodeBuild lab3-cdk-build-9020861

Deploy → CloudFormation create/update Lab3Infra9020861Stack

3. Local CDK Commands Used (cdk synth and cdk diff)
3.1 Infra Stack

From the project root:

# Install dependencies (first time)
npm install

# Generate CloudFormation template for infra stack
cdk synth Lab3Infra9020861Stack

# Show differences
cdk diff Lab3Infra9020861Stack

This confirms the CDK code is valid and shows what changes will be deployed.

3.2 Pipeline Stack

To deploy the pipeline stack itself (one-time manual deploy):

cdk synth Lab3Pipeline9020861Stack
cdk deploy Lab3Pipeline9020861Stack

After this, the pipeline is created in AWS CodePipeline.

4. GitHub → CodePipeline Integration (CodeStar Connection)

GitHub repo: https://github.com/<username>/cdk-lab3-9020861

AWS Developer Tools → Connections:

Connection name: github-connection-lab3-9020861

Provider: GitHub

Repos allowed: cdk-lab3-9020861

This connection ARN is used in the CDK pipeline stack for the Source action.

Any push to main in this repo triggers the pipeline automatically because triggerOnPush: true is set in the CodeConnectionsSourceAction.

5. CI/CD Pipeline Flow (3 Stages)

Pipeline name: lab3-cdk-pipeline-9020861

Source Stage

Action: GitHub_Source (CodeStar Connections)

Pulls latest code from:

Repo: cdk-lab3-9020861

Branch: main

Output: SourceOutput.

Build Stage

Action: CDK_Synth using CodeBuild project lab3-cdk-build-9020861.

Runs buildspec.yml:

npm install -g aws-cdk

npm install

cdk synth Lab3Infra9020861Stack

Output: BuildOutput containing cdk.out/Lab3Infra9020861Stack.template.json.

Deploy Stage

Action: Deploy_Lab3Infra (CloudFormation Create/Update).

Takes template from BuildOutput.

Creates or updates stack Lab3Infra9020861Stack.

After success, the Lambda, API Gateway, and S3 bucket are all deployed.

6. Automatic Deployment Trigger (Change → Push → Redeploy)
6.1 Change Made to Trigger Redeployment

To test auto-trigger, I changed the Lambda response message in lab3-infra-9020861-stack.ts from:

message: "Hello from Lambda via API Gateway (Lab 3)!",

to:
message: "Hello from Lambda via API Gateway (Lab 3) – updated version!",

Then I ran:

cdk diff Lab3Infra9020861Stack   # to see the change in Lambda
git add lib/lab3-infra-9020861-stack.ts
git commit -m "feat: update Lambda response message for lab 3"
git push origin main

This push to main automatically triggered a new pipeline execution:

Source: pulled new code.

Build: re-synthesized template.

Deploy: updated the CloudFormation stack and Lambda function.

After the pipeline turned green, calling /hello on the API Gateway showed the new message, proving that CI/CD is working.

7. Verification Steps (API Gateway, Lambda, Logs)
7.1 Check CloudFormation Outputs

Go to AWS Console → CloudFormation.

Confirm stack Lab3Infra9020861Stack is CREATE_COMPLETE.

Open the stack and go to the Outputs tab.

Copy the value of HelloApiUrl, e.g.:
https://ahzt24iqid.execute-api.us-east-1.amazonaws.com/hello

7.2 Test with Browser & curl

Using Browser:

Paste the HelloApiUrl into the browser.

You should see a JSON response like:
{
  "message": "Hello from Lambda via API Gateway (Lab 3) – updated version!",
  "studentId": "9020861",
  "bucketName": "vk-9020861-lab3-bucket",
  "name": "Varun"
}

Using curl (PowerShell):
curl https://ahzt24iqid.execute-api.us-east-1.amazonaws.com/hello

7.3 Logs and Pipeline Details

CodePipeline logs:

In CodePipeline, open the latest execution of lab3-cdk-pipeline-9020861.

Check each stage (Source, Build, Deploy) for a green “Succeeded” status.

CodeBuild logs:

From the Build stage, click the build ID to open CodeBuild.

View Build logs to see:

npm install

cdk synth Lab3Infra9020861Stack

CloudFormation stack outputs:

Confirm HelloApiUrl and that resources are correctly created.

Lambda logs (optional):

Go to CloudWatch Logs → Log groups.

Find the log group for lab3-hello-lambda-9020861.

Verify the Lambda logs show events when hitting the /hello endpoint.

8. Issues Faced and How I Fixed Them
8.1 S3 autoDeleteObjects Custom Resource Error

On the first pipeline run, the Deploy stage failed with an error:

Stack status: ROLLBACK_COMPLETE

First failed resource:

CustomS3AutoDeleteObjectsCustomResourceProviderHandler...

Error message (simplified):

Error occurred while GetObject. S3 Error Code: NoSuchKey. The specified key does not exist.

Cause:

My S3 bucket was configured with autoDeleteObjects: true.

This makes CDK create a custom Lambda to delete bucket objects during stack deletion.

The code for that Lambda is stored as a CDK asset in S3.

Because the pipeline only ran cdk synth (and not cdk deploy), the Lambda asset zip was not uploaded.

When CloudFormation tried to create the custom resource Lambda, it could not find the code in S3 (NoSuchKey).

Fix:

I deleted the failed stack Lab3Infra9020861Stack from CloudFormation.

In lab3-infra-9020861-stack.ts, I removed the autoDeleteObjects: true line from the bucket configuration.

I re-ran:

cdk synth Lab3Infra9020861Stack
git add lib/lab3-infra-9020861-stack.ts
git commit -m "fix: remove autoDeleteObjects from lab3 bucket for pipeline deploy"
git push origin main


The push triggered a new pipeline run.

This time, Deploy succeeded and the infra stack was created successfully.

This shows understanding of how CDK assets interact with CloudFormation and why certain options (like autoDeleteObjects) can cause issues in CI/CD pipelines that only run cdk synth.

10. Cleanup (to Avoid Charges)

After verifying everything and saving screenshots:

1. Destroy infra stack:
   cdk destroy Lab3Infra9020861Stack
2. Destroy pipeline stack:
   cdk destroy Lab3Pipeline9020861Stack
In the AWS console, confirm:

No CloudFormation stacks left for this lab.

The S3 bucket vk-9020861-lab3-bucket and API Gateway and Lambda are deleted.



