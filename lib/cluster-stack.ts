import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { PhysicalName } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KubectlLayer } from 'aws-cdk-lib/lambda-layer-kubectl';

export interface EksProps extends cdk.StackProps {
  cluster: eks.Cluster
}

export interface ClusterProps extends cdk.StackProps {
  onDemandInstanceType: string,
  primaryRegion: string
}

export interface CicdProps extends cdk.StackProps {
  regionCluster: eks.Cluster,
  regionRole: iam.Role,
  region: string,
}

export class ClusterStack extends cdk.Stack {

  public readonly cluster: eks.Cluster;
  public readonly regionRole: iam.Role;

  constructor(scope: Construct, id: string, props: ClusterProps) {
    super(scope, id, props);

    const clusterAdmin = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
      });

    const cluster = new eks.Cluster(this, 'demoeks--cluster', {
        clusterName: `demoeks`,
        mastersRole: clusterAdmin,
        version: eks.KubernetesVersion.V1_24,
        kubectlLayer: new KubectlLayer(this, 'KubectlLayer'),
        defaultCapacity: 2,
        defaultCapacityInstance: new ec2.InstanceType(props.onDemandInstanceType)
    });

    this.cluster = cluster;

    if (cdk.Stack.of(this).region==props.primaryRegion) {
        this.regionRole = createDeployRole(this, `for-1st-region`, cluster);
    }
  }
}

function createDeployRole(scope: Construct, id: string, cluster: eks.Cluster): iam.Role {
  const role = new iam.Role(scope, id, {
    roleName: PhysicalName.GENERATE_IF_NEEDED,
    assumedBy: new iam.AccountRootPrincipal()
  });
  cluster.awsAuth.addMastersRole(role);

  return role;
}


