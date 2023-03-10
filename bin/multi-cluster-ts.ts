#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClusterStack } from '../lib/cluster-stack';
import { ContainerStack } from '../lib/container-stack';
import { CicdStack } from '../lib/cicd-stack';

const app = new cdk.App();

const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = {account: account, region: 'us-east-2'};
const primaryOnDemandInstanceType = 't4g.nano';

const primaryCluster = new ClusterStack(app, `ClusterStack-${primaryRegion.region}`, {env: primaryRegion, 
    onDemandInstanceType: primaryOnDemandInstanceType,
    primaryRegion: primaryRegion.region
 });

 new ContainerStack(app, `ContainerStack-${primaryRegion.region}`, {env: primaryRegion, cluster: primaryCluster.cluster });


new CicdStack(app, `CicdStack`, {env: primaryRegion, 
    region: primaryRegion.region,
    regionCluster: primaryCluster.cluster,
    regionRole: primaryCluster.regionRole,
});

app.synth();