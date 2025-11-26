import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigw2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class Lab3Infra9020861Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1) S3 bucket (optional but recommended, used as config/storage)
    const bucket = new s3.Bucket(this, 'Lab3Bucket9020861', {
      bucketName: 'vk-9020861-lab3-bucket', // must be globally unique; if deploy fails, adjust name
      removalPolicy: RemovalPolicy.DESTROY, // dev/test only
    // autoDeleteObjects removed: pipeline uses plain CloudFormation deploy
});


    // 2) Lambda function
    const helloLambda = new lambda.Function(this, 'HelloLambda9020861', {
      functionName: 'lab3-hello-lambda-9020861',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("Event:", JSON.stringify(event));
          const name = process.env.STUDENT_NAME || "Varun";
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "Hello from Lambda via API Gateway (Lab 3)!",
              studentId: "9020861",
              bucketName: process.env.BUCKET_NAME,
              name,
            }),
          };
        };
      `),
      timeout: Duration.seconds(10),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        STUDENT_NAME: 'Varun', // example of configurable value
      },
    });

    // Allow Lambda to read/write S3
    bucket.grantReadWrite(helloLambda);

    // 3) HTTP API Gateway integrated with Lambda
    const httpApi = new apigw2.HttpApi(this, 'Lab3HttpApi9020861', {
      apiName: 'lab3-http-api-9020861',
      description: 'HTTP API for Lab 3 that integrates with Lambda on GET /hello',
    });

    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'HelloIntegration9020861',
      helloLambda,
    );

    // Route: GET /hello -> Lambda
    httpApi.addRoutes({
      path: '/hello',
      methods: [apigw2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Output the full URL for testing
    new CfnOutput(this, 'HelloApiUrl', {
      value: httpApi.apiEndpoint + '/hello',
      description: 'Invoke this URL with GET to trigger the Lambda function',
    });
  }
}
